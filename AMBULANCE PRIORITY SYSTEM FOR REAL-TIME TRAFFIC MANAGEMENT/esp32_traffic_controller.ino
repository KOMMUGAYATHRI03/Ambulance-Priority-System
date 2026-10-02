/*
  ==============================================================================
  BTech Project: Ambulance Priority System for Real-Time Traffic Management
  ESP32 Traffic Signal Controller Sketch
  ==============================================================================
  
  USB Serial Communication Protocol (Baud Rate: 115200)
  Receives Commands from Python YOLOv8 Detector:
  - NORMAL         : Resumes regular timed traffic light cycle
  - NORTH_PRIORITY : Sets North signal to GREEN, turns South/East/West to RED
  - SOUTH_PRIORITY : Sets South signal to GREEN, turns North/East/West to RED
  - EAST_PRIORITY  : Sets East signal to GREEN, turns North/South/West to RED
  - WEST_PRIORITY  : Sets West signal to GREEN, turns North/South/East to RED
  
  GPIO Pin Mapping (ESP32-WROOM-32):
  - NORTH Traffic Light: Red=GPIO 23, Yellow=GPIO 22, Green=GPIO 21
  - SOUTH Traffic Light: Red=GPIO 19, Yellow=GPIO 18, Green=GPIO 5
  - EAST  Traffic Light: Red=GPIO 17, Yellow=GPIO 16, Green=GPIO 4
  - WEST  Traffic Light: Red=GPIO 2,  Yellow=GPIO 15, Green=GPIO 13
*/

#include <Arduino.h>

// GPIO Pin Definitions for 4 Intersection Approaches
const int NORTH_RED    = 23;
const int NORTH_YELLOW = 22;
const int NORTH_GREEN  = 21;

const int SOUTH_RED    = 19;
const int SOUTH_YELLOW = 18;
const int SOUTH_GREEN  = 5;

const int EAST_RED     = 17;
const int EAST_YELLOW  = 16;
const int EAST_GREEN   = 4;

const int WEST_RED     = 2;
const int WEST_YELLOW  = 15;
const int WEST_GREEN   = 13;

// System State Variables
String currentMode = "NORMAL";
unsigned long lastCycleTime = 0;
int cyclicPhase = 0;

void setAllRed() {
  digitalWrite(NORTH_RED, HIGH);   digitalWrite(NORTH_YELLOW, LOW); digitalWrite(NORTH_GREEN, LOW);
  digitalWrite(SOUTH_RED, HIGH);   digitalWrite(SOUTH_YELLOW, LOW); digitalWrite(SOUTH_GREEN, LOW);
  digitalWrite(EAST_RED, HIGH);    digitalWrite(EAST_YELLOW, LOW);  digitalWrite(EAST_GREEN, LOW);
  digitalWrite(WEST_RED, HIGH);    digitalWrite(WEST_YELLOW, LOW);  digitalWrite(WEST_GREEN, LOW);
}

void applyNorthPriority() {
  setAllRed();
  digitalWrite(NORTH_RED, LOW);
  digitalWrite(NORTH_GREEN, HIGH);
  Serial.println("[ESP32 ACK] Executed: NORTH_PRIORITY (North GREEN, Cross RED)");
}

void applySouthPriority() {
  setAllRed();
  digitalWrite(SOUTH_RED, LOW);
  digitalWrite(SOUTH_GREEN, HIGH);
  Serial.println("[ESP32 ACK] Executed: SOUTH_PRIORITY (South GREEN, Cross RED)");
}

void applyEastPriority() {
  setAllRed();
  digitalWrite(EAST_RED, LOW);
  digitalWrite(EAST_GREEN, HIGH);
  Serial.println("[ESP32 ACK] Executed: EAST_PRIORITY (East GREEN, Cross RED)");
}

void applyWestPriority() {
  setAllRed();
  digitalWrite(WEST_RED, LOW);
  digitalWrite(WEST_GREEN, HIGH);
  Serial.println("[ESP32 ACK] Executed: WEST_PRIORITY (West GREEN, Cross RED)");
}

void handleNormalCyclicMode() {
  unsigned long now = millis();
  if (now - lastCycleTime >= 4000) { // Cycle every 4 seconds
    lastCycleTime = now;
    cyclicPhase = (cyclicPhase + 1) % 4;
    
    setAllRed();
    switch (cyclicPhase) {
      case 0:
        digitalWrite(NORTH_RED, LOW); digitalWrite(NORTH_GREEN, HIGH);
        break;
      case 1:
        digitalWrite(EAST_RED, LOW);  digitalWrite(EAST_GREEN, HIGH);
        break;
      case 2:
        digitalWrite(SOUTH_RED, LOW); digitalWrite(SOUTH_GREEN, HIGH);
        break;
      case 3:
        digitalWrite(WEST_RED, LOW);  digitalWrite(WEST_GREEN, HIGH);
        break;
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  // Set GPIO Pins as Outputs
  pinMode(NORTH_RED, OUTPUT);    pinMode(NORTH_YELLOW, OUTPUT);    pinMode(NORTH_GREEN, OUTPUT);
  pinMode(SOUTH_RED, OUTPUT);    pinMode(SOUTH_YELLOW, OUTPUT);    pinMode(SOUTH_GREEN, OUTPUT);
  pinMode(EAST_RED, OUTPUT);     pinMode(EAST_YELLOW, OUTPUT);     pinMode(EAST_GREEN, OUTPUT);
  pinMode(WEST_RED, OUTPUT);     pinMode(WEST_YELLOW, OUTPUT);     pinMode(WEST_GREEN, OUTPUT);
  
  setAllRed();
  Serial.println("=================================================");
  Serial.println("🚑 ESP32 Traffic Controller Ready - Waiting for Commands");
  Serial.println("=================================================");
}

void loop() {
  // Read Serial Commands from Python Detector
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toUpperCase();
    
    if (cmd.length() > 0) {
      if (cmd == "NORTH_PRIORITY") {
        currentMode = "NORTH_PRIORITY";
        applyNorthPriority();
      } else if (cmd == "SOUTH_PRIORITY") {
        currentMode = "SOUTH_PRIORITY";
        applySouthPriority();
      } else if (cmd == "EAST_PRIORITY") {
        currentMode = "EAST_PRIORITY";
        applyEastPriority();
      } else if (cmd == "WEST_PRIORITY") {
        currentMode = "WEST_PRIORITY";
        applyWestPriority();
      } else if (cmd == "NORMAL") {
        currentMode = "NORMAL";
        Serial.println("[ESP32 ACK] Executed: NORMAL (Resuming Cyclic Mode)");
      } else {
        Serial.print("[ESP32 ERROR] Unknown Command: ");
        Serial.println(cmd);
      }
    }
  }
  
  // If in normal mode, run standard traffic signal loop
  if (currentMode == "NORMAL") {
    handleNormalCyclicMode();
  }
}
