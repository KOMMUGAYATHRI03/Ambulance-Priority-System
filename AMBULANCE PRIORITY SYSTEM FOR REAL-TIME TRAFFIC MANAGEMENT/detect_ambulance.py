# ==============================================================================
# BTech Project: Ambulance Priority System for Real-Time Traffic Management
# Module 1 & 2: YOLOv8 Ambulance Detection + ESP32 USB Serial Integration
# ==============================================================================

import cv2
import time
import argparse
import os
import json
import urllib.request
import numpy as np
from ultralytics import YOLO

# Import ESP32 USB Serial Module
from esp32_serial import ESP32SerialController

FIREBASE_IOT_URL = "https://ambulance-detection-b47d5-default-rtdb.firebaseio.com/iot/system_status.json"


def send_status_to_firebase(payload):
    """Pushes real-time system metrics to Firebase Realtime Database."""
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(FIREBASE_IOT_URL, data=data, method="PUT")
        req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, timeout=2) as response:
            pass
    except Exception as e:
        pass


def get_ambulance_direction(cx, cy, frame_width, frame_height):
    """
    Determines direction (NORTH, SOUTH, EAST, WEST) based on the 
    ambulance bounding-box center (cx, cy) relative to predefined frame regions.
    """
    center_x = frame_width / 2.0
    center_y = frame_height / 2.0

    dx = cx - center_x
    dy = cy - center_y

    if abs(dx) > abs(dy):
        return "EAST" if dx > 0 else "WEST"
    else:
        return "NORTH" if dy < 0 else "SOUTH"


def main():
    parser = argparse.ArgumentParser(description="Ambulance Priority System - YOLOv8 Detector & ESP32 Controller")
    parser.add_argument("--source", type=str, default="sample_ambulance.mp4", 
                        help="Path to input traffic video file (e.g. traffic.mp4) or camera index (0)")
    parser.add_argument("--weights", type=str, default="yolov8n.pt", 
                        help="Path to YOLOv8 model weights file (.pt)")
    parser.add_argument("--conf", type=float, default=0.35, 
                        help="Detection confidence threshold (default: 0.35)")
    parser.add_argument("--port", type=str, default=None, 
                        help="ESP32 COM Port (e.g. COM3 or COM4). Auto-scans if not specified.")
    args = parser.parse_args()

    print("=" * 75)
    print("🚑 AMBULANCE PRIORITY SYSTEM - YOLOv8 + ESP32 HARDWARE CONTROLLER")
    print("=" * 75)

    # 1. Initialize ESP32 USB Serial Communication
    esp32 = ESP32SerialController(port=args.port)

    # 2. Load YOLOv8 Model
    custom_model_file = "ambulance_model.pt"
    if os.path.exists(custom_model_file):
        model_path = custom_model_file
        print(f"🎯 Using Custom Ambulance Model: '{model_path}'")
    else:
        model_path = args.weights
        print(f"🌐 Using Standard YOLOv8 Model: '{model_path}'")

    try:
        model = YOLO(model_path)
        print("✅ YOLOv8 Model loaded successfully!")
    except Exception as e:
        print(f"❌ Error loading YOLO model: {e}")
        return

    # 3. Setup Video Input Stream
    video_source = args.source

    if video_source.isdigit():
        video_source = int(video_source)
        print(f"📹 Opening Live Webcam Input (Camera Index: {video_source})...")
    else:
        print(f"🎥 Reading Input Traffic Video File: '{video_source}'...")
        if not os.path.exists(video_source):
            print(f"⚠️ Video file '{video_source}' not found! Generating sample test video...")
            try:
                from generate_sample_video import create_sample_traffic_video
                create_sample_traffic_video(filename="sample_ambulance.mp4")
                video_source = "sample_ambulance.mp4"
            except Exception as err:
                print(f"Error generating sample video: {err}")
                return

    cap = cv2.VideoCapture(video_source)

    if not cap.isOpened():
        print(f"❌ Error: Cannot open video source '{video_source}'")
        return

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0 or np.isnan(fps):
        fps = 30

    print(f"📐 Video Specifications: {width}x{height} pixels @ {fps:.1f} FPS")
    print("-" * 75)
    print("⚡ Starting Real-Time Ambulance Detection & ESP32 Serial Loop...")
    print("👉 Press 'q' or 'ESC' in the window to stop the program.\n")

    prev_time = time.time()
    last_firebase_sync = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            if isinstance(video_source, str):
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            else:
                break

        current_time = time.time()
        fps_display = 1.0 / (current_time - prev_time + 1e-5)
        prev_time = current_time

        # Draw Frame Sector Boundaries (NORTH, SOUTH, EAST, WEST)
        cx_mid, cy_mid = int(width / 2), int(height / 2)
        cv2.line(frame, (cx_mid, 0), (cx_mid, height), (70, 80, 95), 1, cv2.LINE_AA)
        cv2.line(frame, (0, cy_mid), (width, cy_mid), (70, 80, 95), 1, cv2.LINE_AA)

        cv2.putText(frame, "NORTH", (cx_mid - 25, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (140, 160, 180), 1)
        cv2.putText(frame, "SOUTH", (cx_mid - 25, height - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (140, 160, 180), 1)
        cv2.putText(frame, "WEST", (10, cy_mid + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (140, 160, 180), 1)
        cv2.putText(frame, "EAST", (width - 50, cy_mid + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (140, 160, 180), 1)

        # Perform YOLOv8 Detection
        results = model(frame, conf=args.conf, verbose=False)

        ambulance_detected = False
        highest_confidence = 0.0
        detected_direction = "NORTH"

        for result in results:
            boxes = result.boxes
            for box in boxes:
                class_id = int(box.cls[0].item())
                class_name = model.names[class_id].lower()
                confidence = float(box.conf[0].item())
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

                is_ambulance = False
                if "ambulance" in class_name:
                    is_ambulance = True
                elif class_name in ["truck", "bus", "car", "vehicle"]:
                    roi = frame[max(0, y1):min(height, y2), max(0, x1):min(width, x2)]
                    if roi.size > 0:
                        avg_bgr = np.mean(roi, axis=(0, 1))
                        if avg_bgr[2] > 110:
                            is_ambulance = True

                if is_ambulance or (class_name in ["truck", "bus"] and confidence > 0.4):
                    ambulance_detected = True
                    if confidence > highest_confidence:
                        highest_confidence = confidence

                    box_cx = int((x1 + x2) / 2)
                    box_cy = int((y1 + y2) / 2)

                    detected_direction = get_ambulance_direction(box_cx, box_cy, width, height)

                    # Draw Bounding Box (Neon Green)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 230, 118), 3)

                    # Center Point & Vector Line
                    cv2.circle(frame, (box_cx, box_cy), 6, (0, 230, 118), -1)
                    cv2.line(frame, (cx_mid, cy_mid), (box_cx, box_cy), (0, 229, 255), 2)

                    # Bounding Box Tag
                    box_label = f"AMBULANCE [{detected_direction}]: {confidence * 100:.1f}%"
                    (w, h), _ = cv2.getTextSize(box_label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
                    cv2.rectangle(frame, (x1, y1 - 25), (x1 + w + 10, y1), (0, 230, 118), -1)
                    cv2.putText(frame, box_label, (x1 + 5, y1 - 7), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (10, 10, 10), 2)

        # Send Priority Command to ESP32 over USB Serial
        if ambulance_detected:
            esp32_cmd = f"{detected_direction}_PRIORITY"
        else:
            esp32_cmd = "NORMAL"

        esp32.send_command(esp32_cmd)

        # Top Alert Overlay Banner
        if ambulance_detected:
            cv2.rectangle(frame, (0, 0), (width, 65), (0, 0, 220), -1)
            cv2.putText(frame, "AMBULANCE DETECTED", (20, 24), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            sub_info = f"DIRECTION: {detected_direction}   |   CONF: {highest_confidence * 100:.1f}%   |   ESP32: {esp32_cmd}"
            cv2.putText(frame, sub_info, (20, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 230, 0), 2)
        else:
            cv2.rectangle(frame, (0, 0), (width, 36), (20, 25, 35), -1)
            serial_tag = f"ESP32: {esp32.port or 'SIMULATION MODE'}"
            cv2.putText(frame, f"Traffic Surveillance Active | {serial_tag} | FPS: {fps_display:.1f}", 
                        (15, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 200, 220), 1)

        # Sync IoT Status to Firebase Realtime Database
        if current_time - last_firebase_sync > 0.3:
            timestamp_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
            iot_payload = {
                "ambulance_detected": ambulance_detected,
                "direction": detected_direction if ambulance_detected else "NONE",
                "confidence": round(highest_confidence * 100, 1) if ambulance_detected else 0.0,
                "traffic_mode": "PRIORITY PREEMPTION MODE" if ambulance_detected else "NORMAL CYCLIC MODE",
                "active_green_signal": f"JUNCTION {detected_direction} GREEN" if ambulance_detected else "NORMAL CYCLIC PHASE",
                "esp32_status": f"CONNECTED ({esp32.port})" if esp32.is_connected else "SIMULATION MODE",
                "timestamp": timestamp_str
            }
            send_status_to_firebase(iot_payload)
            last_firebase_sync = current_time

        cv2.imshow("Ambulance Priority System - Detector & ESP32 Controller", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == 27:
            print("\n🛑 Program stopped by user.")
            break

    esp32.close()
    cap.release()
    cv2.destroyAllWindows()
    print("✅ Detector & Serial stream closed cleanly.")

if __name__ == "__main__":
    main()
