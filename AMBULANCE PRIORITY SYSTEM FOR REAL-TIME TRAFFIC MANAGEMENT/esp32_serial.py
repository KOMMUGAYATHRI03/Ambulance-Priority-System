# ==============================================================================
# BTech Project: Ambulance Priority System for Real-Time Traffic Management
# Module 2: Python to ESP32 Serial Communication Module
# ==============================================================================

import time
import sys

try:
    import serial
    import serial.tools.list_ports
    HAS_PYSERIAL = True
except ImportError:
    HAS_PYSERIAL = False


class ESP32SerialController:
    """
    Handles USB Serial Communication between Python YOLOv8 Detector and ESP32.
    Supports automatic COM port scanning, command transmission, acknowledgment 
    reading, and graceful fallback when ESP32 is disconnected.
    """

    def __init__(self, port=None, baudrate=115200, timeout=1.0):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.serial_conn = None
        self.is_connected = False
        self.last_command = None

        if HAS_PYSERIAL:
            self.connect()
        else:
            print("[ESP32 SERIAL] 'pyserial' package missing. Running in Simulation Mode.")

    def auto_find_esp32_port(self):
        """Scans system COM ports for ESP32 / CP210x / CH340 USB Serial devices."""
        if not HAS_PYSERIAL:
            return None

        ports = list(serial.tools.list_ports.comports())
        for p in ports:
            # Common USB Serial CH340 / CP2102 / FTDI descriptors for ESP32
            desc = p.description.lower()
            if any(k in desc for k in ["cp210", "ch340", "usb serial", "esp32", "uart"]):
                print(f"[ESP32 SERIAL] Discovered ESP32 on port: {p.device} ({p.description})")
                return p.device

        # If any COM port is available on Windows, return the first one as fallback
        if len(ports) > 0:
            print(f"[ESP32 SERIAL] Found available serial port: {ports[0].device}")
            return ports[0].device

        return None

    def connect(self):
        """Establishes Serial connection with ESP32."""
        if not HAS_PYSERIAL:
            self.is_connected = False
            return False

        if not self.port:
            self.port = self.auto_find_esp32_port()

        if not self.port:
            print("[ESP32 SERIAL WARNING] No ESP32 COM port detected. Running in Serial Simulation Mode.")
            self.is_connected = False
            return False

        try:
            self.serial_conn = serial.Serial(self.port, self.baudrate, timeout=self.timeout)
            time.sleep(2) # Allow ESP32 reboot reset delay
            self.is_connected = True
            print(f"[ESP32 SERIAL SUCCESS] Connected to ESP32 on {self.port} @ {self.baudrate} baud.")
            return True
        except serial.SerialException as e:
            print(f"[ESP32 SERIAL WARNING] Could not open port '{self.port}': {e}")
            print("[ESP32 SERIAL] Falling back to Serial Simulation Mode.")
            self.is_connected = False
            self.serial_conn = None
            return False

    def send_command(self, command):
        """
        Sends traffic priority command to ESP32 over USB Serial.
        Supported Commands:
        - NORMAL
        - NORTH_PRIORITY
        - SOUTH_PRIORITY
        - EAST_PRIORITY
        - WEST_PRIORITY
        """
        command = command.strip().upper()
        
        valid_commands = ["NORMAL", "NORTH_PRIORITY", "SOUTH_PRIORITY", "EAST_PRIORITY", "WEST_PRIORITY"]
        if command not in valid_commands:
            print(f"[ESP32 SERIAL ERROR] Invalid command '{command}'. Valid: {valid_commands}")
            return False

        # Avoid spamming identical command continuously
        if command == self.last_command:
            return True

        self.last_command = command

        if self.is_connected and self.serial_conn and self.serial_conn.is_open:
            try:
                cmd_bytes = f"{command}\n".encode('utf-8')
                self.serial_conn.write(cmd_bytes)
                self.serial_conn.flush()
                print(f"[ESP32 SERIAL TX ⚡] Sent command: '{command}'")
                
                # Optional ACK read
                ack = self.read_response()
                if ack:
                    print(f"[ESP32 SERIAL RX 📩] Response: {ack}")
                return True
            except Exception as e:
                print(f"[ESP32 SERIAL DISCONNECT] Lost connection to ESP32: {e}")
                self.is_connected = False
                return False
        else:
            # Simulation Mode Logging
            print(f"[ESP32 SERIAL SIMULATION 🔌] Output Command -> ESP32: '{command}'")
            return True

    def read_response(self):
        """Reads acknowledgment response from ESP32."""
        if self.is_connected and self.serial_conn and self.serial_conn.is_open:
            try:
                if self.serial_conn.in_waiting > 0:
                    line = self.serial_conn.readline().decode('utf-8', errors='ignore').strip()
                    return line
            except Exception:
                pass
        return None

    def close(self):
        """Closes the serial connection safely."""
        if self.serial_conn and self.serial_conn.is_open:
            try:
                self.send_command("NORMAL")
                self.serial_conn.close()
                print("[ESP32 SERIAL] Connection closed cleanly.")
            except Exception:
                pass
        self.is_connected = False


# Quick Self-Test when run directly
if __name__ == "__main__":
    print("Testing ESP32 Serial Controller Module...")
    esp32 = ESP32SerialController()
    
    test_commands = ["NORMAL", "EAST_PRIORITY", "NORTH_PRIORITY", "NORMAL"]
    for cmd in test_commands:
        esp32.send_command(cmd)
        time.sleep(1)
        
    esp32.close()
