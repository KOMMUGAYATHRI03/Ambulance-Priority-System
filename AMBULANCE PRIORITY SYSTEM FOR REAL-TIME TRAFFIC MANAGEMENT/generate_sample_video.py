import cv2
import numpy as np
import sys
import os

def create_sample_traffic_video(filename="sample_ambulance.mp4", duration_sec=8, fps=30):
    width, height = 800, 600
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(filename, fourcc, fps, (width, height))

    total_frames = duration_sec * fps

    print(f"[VIDEO GEN] Generating test traffic video: '{filename}' ({total_frames} frames)...")

    for frame_num in range(total_frames):
        # Create road scene canvas
        frame = np.full((height, width, 3), (25, 30, 40), dtype=np.uint8)

        # Draw asphalt road lanes
        cv2.rectangle(frame, (150, 0), (650, height), (40, 45, 55), -1)
        cv2.rectangle(frame, (145, 0), (150, height), (255, 255, 255), -1)
        cv2.rectangle(frame, (650, 0), (655, height), (255, 255, 255), -1)

        # Center dashed line
        dash_offset = (frame_num * 6) % 40
        for y in range(-dash_offset, height, 40):
            cv2.line(frame, (400, y), (400, y + 20), (255, 255, 255), 3)

        # Background civilian cars
        car1_y = (frame_num * 4) % (height + 100) - 50
        cv2.rectangle(frame, (220, int(car1_y)), (290, int(car1_y) + 120), (180, 50, 50), -1)
        cv2.putText(frame, "CAR", (230, int(car1_y) + 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        car2_y = ((frame_num * 3) + 200) % (height + 100) - 50
        cv2.rectangle(frame, (510, int(car2_y)), (580, int(car2_y) + 110), (50, 120, 180), -1)

        # Approaching Ambulance (moving down center lane)
        amb_y = height - int((frame_num / total_frames) * (height + 200))
        if amb_y > -150 and amb_y < height + 50:
            amb_x = 350
            amb_w, amb_h = 100, 170

            # Ambulance Body (White)
            cv2.rectangle(frame, (amb_x, amb_y), (amb_x + amb_w, amb_y + amb_h), (240, 240, 240), -1)
            cv2.rectangle(frame, (amb_x, amb_y), (amb_x + amb_w, amb_y + amb_h), (0, 0, 0), 2)

            # Red Cross & Stripes
            stripe_y = amb_y + 40
            cv2.rectangle(frame, (amb_x, stripe_y), (amb_x + amb_w, stripe_y + 25), (0, 0, 220), -1)
            cv2.putText(frame, "AMBULANCE", (amb_x + 6, stripe_y + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 2)

            # Red Cross Logo
            cross_cx, cross_cy = amb_x + 50, amb_y + 110
            cv2.rectangle(frame, (cross_cx - 15, cross_cy - 5), (cross_cx + 15, cross_cy + 5), (0, 0, 220), -1)
            cv2.rectangle(frame, (cross_cx - 5, cross_cy - 15), (cross_cx + 5, cross_cy + 15), (0, 0, 220), -1)

            # Flashing Emergency Beacon Light
            beacon_color = (0, 0, 255) if (frame_num % 6 < 3) else (255, 0, 0)
            cv2.circle(frame, (amb_x + 30, amb_y + 15), 10, beacon_color, -1)
            cv2.circle(frame, (amb_x + 70, amb_y + 15), 10, beacon_color, -1)
            cv2.circle(frame, (amb_x + 50, amb_y + 15), 14, (255, 255, 255), 2)

        # Traffic Signal Light Overlay top right
        cv2.rectangle(frame, (700, 30), (760, 170), (15, 20, 30), -1)
        cv2.rectangle(frame, (700, 30), (760, 170), (100, 110, 130), 2)

        is_preemption = (amb_y < 350 and amb_y > 50)
        red_color = (0, 0, 255) if not is_preemption else (30, 30, 60)
        green_color = (0, 255, 0) if is_preemption else (30, 60, 30)

        cv2.circle(frame, (730, 60), 18, red_color, -1)
        cv2.circle(frame, (730, 100), 18, (30, 50, 50), -1)
        cv2.circle(frame, (730, 140), 18, green_color, -1)

        cv2.putText(frame, "CORRIDOR SIGNAL", (660, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 220, 255), 1)

        out.write(frame)

    out.release()
    print(f"[SUCCESS] Generated sample video: '{filename}' successfully!")

if __name__ == "__main__":
    create_sample_traffic_video()
