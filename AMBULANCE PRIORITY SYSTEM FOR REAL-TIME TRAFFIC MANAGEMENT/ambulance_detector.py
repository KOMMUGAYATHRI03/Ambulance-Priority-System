import cv2
import time
import json
import argparse
import os
import sys
import numpy as np

try:
    from ultralytics import YOLO
except ImportError:
    print("[ERROR] 'ultralytics' library is not installed.")
    print("Please install it using: pip install ultralytics opencv-python")
    sys.exit(1)


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


def run_ambulance_detection(
    source="sample_ambulance.mp4",
    weights_path="yolov8n.pt",
    conf_threshold=0.35,
    show_window=True,
    output_save_path=None
):
    print("=" * 75)
    print("[SYSTEM] STAGE 1 (EXTENDED): YOLOv8 AMBULANCE DETECTION & DIRECTION MODULE")
    print("=" * 75)

    custom_weights = "ambulance_yolov8.pt"
    if os.path.exists(custom_weights):
        model_file = custom_weights
        print(f"[MODEL] Found custom trained ambulance model: '{model_file}'")
    elif os.path.exists(weights_path):
        model_file = weights_path
        print(f"[MODEL] Using specified model weights: '{model_file}'")
    else:
        model_file = "yolov8n.pt"
        print(f"[MODEL] Loading standard YOLOv8 nano model: '{model_file}' (COCO weights)...")

    try:
        model = YOLO(model_file)
        print("[MODEL] YOLOv8 Model loaded successfully!")
    except Exception as e:
        print(f"[ERROR] Loading YOLO model '{model_file}': {e}")
        return

    is_webcam = False
    if str(source).isdigit():
        source_input = int(source)
        is_webcam = True
        print(f"[INPUT] Opening Webcam camera index: {source_input}")
    else:
        source_input = source
        print(f"[INPUT] Opening video file: '{source_input}'")

    if not is_webcam and not os.path.exists(source_input):
        print(f"[WARNING] Video file '{source_input}' not found. Generating sample test video...")
        try:
            from generate_sample_video import create_sample_traffic_video
            create_sample_traffic_video(filename=source_input)
        except Exception as e:
            print(f"[ERROR] Generating sample video: {e}")

    cap = cv2.VideoCapture(source_input)

    if not cap.isOpened():
        print(f"[ERROR] Unable to open video source '{source_input}'")
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or np.isnan(fps):
        fps = 30

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"[VIDEO] Resolution: {width}x{height} @ {fps:.1f} FPS")

    out_writer = None
    if output_save_path:
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out_writer = cv2.VideoWriter(output_save_path, fourcc, fps, (width, height))
        print(f"[OUTPUT] Saving processed video to: '{output_save_path}'")

    print("\n[START] Detection & Direction tracking loop active. Press 'q' or 'Esc' to stop.\n")

    frame_count = 0
    start_time = time.time()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            if not is_webcam:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            else:
                break

        frame_count += 1
        current_fps = frame_count / (time.time() - start_time + 1e-5)

        # Predefined Frame Sector Guidelines
        cx_mid, cy_mid = int(width / 2), int(height / 2)
        cv2.line(frame, (cx_mid, 0), (cx_mid, height), (70, 80, 95), 1, cv2.LINE_AA)
        cv2.line(frame, (0, cy_mid), (width, cy_mid), (70, 80, 95), 1, cv2.LINE_AA)

        cv2.putText(frame, "NORTH", (cx_mid - 25, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (140, 160, 180), 1)
        cv2.putText(frame, "SOUTH", (cx_mid - 25, height - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (140, 160, 180), 1)
        cv2.putText(frame, "WEST", (10, cy_mid + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (140, 160, 180), 1)
        cv2.putText(frame, "EAST", (width - 50, cy_mid + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (140, 160, 180), 1)

        results = model(frame, conf=conf_threshold, verbose=False)

        ambulance_detected = False
        highest_conf = 0.0
        primary_direction = "UNKNOWN"
        detected_boxes = []

        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0].item())
                cls_name = model.names[cls_id].lower()
                conf = float(box.conf[0].item())
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

                is_amb = False
                if 'ambulance' in cls_name:
                    is_amb = True
                elif cls_name in ['truck', 'bus', 'car', 'vehicle']:
                    roi = frame[max(0, y1):min(height, y2), max(0, x1):min(width, x2)]
                    if roi.size > 0:
                        avg_bgr = np.mean(roi, axis=(0, 1))
                        if avg_bgr[2] > 110:
                            is_amb = True

                if is_amb or (cls_name in ['truck', 'bus'] and conf > 0.4):
                    ambulance_detected = True
                    if conf > highest_conf:
                        highest_conf = conf

                    box_cx = int((x1 + x2) / 2)
                    box_cy = int((y1 + y2) / 2)

                    direction = get_ambulance_direction(box_cx, box_cy, width, height)
                    primary_direction = direction

                    detected_boxes.append({
                        "class": "Ambulance",
                        "confidence": round(conf, 4),
                        "direction": direction,
                        "bbox": [x1, y1, x2, y2]
                    })

                    # Draw Bounding Box (Neon Emerald Green)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 230, 118), 3)

                    # Bounding Box Center & Vector Line
                    cv2.circle(frame, (box_cx, box_cy), 6, (0, 230, 118), -1)
                    cv2.line(frame, (cx_mid, cy_mid), (box_cx, box_cy), (0, 229, 255), 2)

                    # Bounding Box Label
                    label_text = f"AMBULANCE [{direction}]: {conf * 100:.1f}%"
                    (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
                    cv2.rectangle(frame, (x1, y1 - 25), (x1 + tw + 10, y1), (0, 230, 118), -1)
                    cv2.putText(frame, label_text, (x1 + 6, y1 - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (10, 10, 10), 2)

        # Top Alert Overlay Banner
        if ambulance_detected:
            banner_bg = (0, 0, 220)
            cv2.rectangle(frame, (0, 0), (width, 65), banner_bg, -1)

            cv2.putText(frame, "AMBULANCE DETECTED", (20, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            sub_text = f"DIRECTION: {primary_direction}   |   CONFIDENCE: {highest_conf * 100:.1f}%"
            cv2.putText(frame, sub_text, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 230, 0), 2)

            if frame_count % 15 == 0:
                print(f"[DETECTION] 🚨 Ambulance Detected! Direction: {primary_direction} | Conf: {highest_conf * 100:.1f}% | FPS: {current_fps:.1f}")
        else:
            cv2.rectangle(frame, (0, 0), (width, 36), (20, 25, 35), -1)
            cv2.putText(frame, f"Traffic Monitor Active | Scanning Junction Approaches... | FPS: {current_fps:.1f}",
                        (15, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 200, 220), 1)

        # Save JSON State
        detection_payload = {
            "ambulance_detected": ambulance_detected,
            "direction": primary_direction,
            "confidence": round(highest_conf * 100, 1),
            "detections": detected_boxes,
            "fps": round(current_fps, 1),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

        try:
            with open("detection_status.json", "w") as f:
                json.dump(detection_payload, f, indent=2)
        except Exception:
            pass

        if out_writer:
            out_writer.write(frame)

        if show_window:
            cv2.imshow("YOLOv8 Ambulance Detection & Direction Module", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == 27:
                print("\n[STOP] Exit key pressed.")
                break

    cap.release()
    if out_writer:
        out_writer.release()
    cv2.destroyAllWindows()
    print("[SUCCESS] Detection module closed cleanly.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="YOLOv8 Ambulance Detection with Direction Identification")
    parser.add_argument("--source", type=str, default="sample_ambulance.mp4", help="Video file path or webcam index (0)")
    parser.add_argument("--weights", type=str, default="yolov8n.pt", help="YOLOv8 model weights file (.pt)")
    parser.add_argument("--conf", type=float, default=0.35, help="Confidence threshold (0.0 to 1.0)")
    parser.add_argument("--output", type=str, default=None, help="Path to save output video (.mp4)")
    args = parser.parse_args()

    run_ambulance_detection(
        source=args.source,
        weights_path=args.weights,
        conf_threshold=args.conf,
        show_window=True,
        output_save_path=args.output
    )
