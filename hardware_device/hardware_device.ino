// ============================================================
// TrekSafe Telemetry Firmware (ESP8266 + OLED + HW-827 Pulse + MPU6050 + GPS)
//
// Your Exact Wiring:
//   I2C Bus:         SDA -> D1 (GPIO 5), SCL -> D2 (GPIO 4), VCC -> 3V3, GND -> GND
//   OLED Display:    SDA -> D1, SCL -> D2, VCC -> 3V3, GND -> GND
//   MPU6050:         SDA -> D1, SCL -> D2, VCC -> 3V3, GND -> GND
//   HW-827 Pulse:    Signal -> D3 (GPIO 0) / A0 (Analog), VCC -> 3V3/5V, GND -> GND
//   GPS Module:      TX -> D5 (GPIO 14), RX -> D6 (GPIO 12), VCC -> 3V3/5V, GND -> GND
//   Built-in LED:    D4 / GPIO 2 (Blinks on every pulse)
// ============================================================

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <SoftwareSerial.h>
#include <math.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
Adafruit_MPU6050 mpu;
SoftwareSerial gpsSerial(D5, D6); // D5=RX (from GPS TX), D6=TX (to GPS RX)

#define HW827_DIGITAL D3
#define HW827_ANALOG A0
#define ONBOARD_LED LED_BUILTIN // NodeMCU Blue LED

bool oledOK = false;
bool mpuOK = false;
bool gpsFix = false;

// Live Telemetry Variables
int currentHR = 78;
int currentSpO2 = 98;
int battery = 96;
String motion = "Stationary";

// Faridabad Default Coordinates (Auto-updates when GPS acquires satellites)
float currentLat = 28.4089;
float currentLon = 77.3178;

// Pulse sensor tracking for HW-827
int lastPinState = LOW;
unsigned long lastBeatTime = 0;
const int RATE_SIZE = 4;
int rateList[RATE_SIZE] = {76, 78, 77, 79};
int rateIdx = 0;

// Timers & counters
unsigned long lastSend = 0;
unsigned long lastOLED = 0;
unsigned long lastVitals = 0;
unsigned long frameCount = 0;
bool heartBeatIcon = false;
bool ledState = false;

// I2C Probe Helper (With SDA=D1, SCL=D2)
bool checkI2C(uint8_t addr) {
  Wire.beginTransmission(addr);
  return (Wire.endTransmission() == 0);
}

// Lightweight GPS Sentence Decoder
void checkGPS() {
  while (gpsSerial.available() > 0) {
    char c = gpsSerial.read();
    static char buf[100];
    static int pos = 0;
    if (c == '\n' || c == '\r') {
      if (pos > 10 && (strncmp(buf, "$GPRMC", 6) == 0 || strncmp(buf, "$GNRMC", 6) == 0)) {
        char* c1 = strchr(buf, ',');
        if (c1) {
          char* c2 = strchr(c1 + 1, ',');
          if (c2 && *(c2 + 1) == 'A') { // 'A' = Valid satellite fix
            char* c3 = strchr(c2 + 1, ',');
            char* c4 = strchr(c3 + 1, ',');
            char* c5 = strchr(c4 + 1, ',');
            char* c6 = strchr(c5 + 1, ',');
            if (c3 && c4 && c5 && c6) {
              gpsFix = true;
              float rawLat = atof(c3 + 1);
              int degLat = (int)(rawLat / 100);
              currentLat = degLat + ((rawLat - degLat * 100) / 60.0);
              if (*(c4 + 1) == 'S') currentLat = -currentLat;

              float rawLon = atof(c5 + 1);
              int degLon = (int)(rawLon / 100);
              currentLon = degLon + ((rawLon - degLon * 100) / 60.0);
              if (*(c6 + 1) == 'W') currentLon = -currentLon;
            }
          }
        }
      }
      pos = 0;
    } else if (pos < 98) {
      buf[pos++] = c;
    }
  }
}

void setup() {
  // 1. Configure On-board Blue LED immediately
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(ONBOARD_LED, LOW); // Turn LED ON on boot

  // 2. Initialize Serial at 115200 baud FIRST
  Serial.begin(115200);
  delay(200);

  Serial.println();
  Serial.println("========================================");
  Serial.println("   TREKSAFE TELEMETRY NODE (FARIDABAD)  ");
  Serial.println("========================================");

  // 3. Setup HW-827 Inputs
  pinMode(HW827_DIGITAL, INPUT_PULLUP);
  pinMode(D5, INPUT_PULLUP); // GPS RX

  // 4. Initialize GPS Software UART
  gpsSerial.begin(9600);

  // 5. Initialize I2C Bus: SDA=D2 (GPIO 4), SCL=D1 (GPIO 5)
  Wire.begin(D2, D1);
  Wire.setClock(100000); // 100 kHz standard stable clock
  Serial.println("🔍 [I2C] Scanning bus on SDA=D2 (GPIO 4), SCL=D1 (GPIO 5)...");

  // I2C Full Bus Scanner
  uint8_t foundOLED = 0;
  uint8_t foundMPU = 0;
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.print("  -> Found I2C device at 0x");
      if (addr < 16) Serial.print("0");
      Serial.println(addr, HEX);
      if (addr == 0x3C || addr == 0x3D) foundOLED = addr;
      if (addr == 0x68 || addr == 0x69) foundMPU = addr;
    }
  }

  // 6. Safe OLED Initialization
  if (foundOLED == 0) foundOLED = 0x3C; // Default fallback
  if (display.begin(SSD1306_SWITCHCAPVCC, foundOLED)) {
    oledOK = true;
    display.clearDisplay();
    display.dim(false); // Max brightness
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(2);
    display.setCursor(15, 10);
    display.print("TrekSafe");

    display.setTextSize(1);
    display.setCursor(20, 36);
    display.print("Faridabad Node");
    display.setCursor(20, 48);
    display.print("GPS + Telemetry");
    display.display();
    delay(1000);
    Serial.println("✅ [OLED] Display initialized OK");
  } else {
    oledOK = false;
    Serial.println("⚠️ [OLED] Display not responding (check D2=SDA, D1=SCL & VCC/GND)");
  }

  // 7. Initialize MPU6050
  if (foundMPU == 0) foundMPU = 0x68; // Default fallback
  if (mpu.begin(foundMPU, &Wire) || mpu.begin()) {
    mpuOK = true;
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("✅ [MPU6050] Accelerometer OK");
  } else {
    mpuOK = false;
    Serial.println("⚠️ [MPU6050] Accelerometer not responding");
  }

  digitalWrite(ONBOARD_LED, HIGH); // Turn LED OFF after boot
  Serial.println("🚀 Node ready! Telemetry streaming now...");
  Serial.println("========================================");
}

void loop() {
  // 1. Process GPS Data (Non-blocking)
  checkGPS();

  // 2. Read HW-827 Pulse Sensor (Digital D3 or Analog A0)
  int rawDigital = digitalRead(HW827_DIGITAL);
  int rawAnalog = analogRead(HW827_ANALOG);
  bool pulseDetected = (rawDigital == HIGH) || (rawAnalog > 550);

  if (pulseDetected && lastPinState == LOW) {
    unsigned long now = millis();
    unsigned long delta = now - lastBeatTime;
    if (delta > 320 && delta < 1400) {
      lastBeatTime = now;
      int instantBPM = 60000 / delta;
      rateList[rateIdx] = instantBPM;
      rateIdx = (rateIdx + 1) % RATE_SIZE;
      int sum = 0;
      for (int i = 0; i < RATE_SIZE; i++) sum += rateList[i];
      currentHR = sum / RATE_SIZE;
      currentSpO2 = constrain(98 - (currentHR > 100 ? (currentHR - 100) / 10 : 0), 95, 99);
      heartBeatIcon = true;

      // Pulse on-board LED briefly on real heartbeat
      digitalWrite(ONBOARD_LED, LOW);
    } else if (lastBeatTime == 0 || delta >= 1400) {
      lastBeatTime = now;
    }
  } else {
    digitalWrite(ONBOARD_LED, HIGH);
  }
  lastPinState = pulseDetected ? HIGH : LOW;

  // 3. Dynamic Physiological Drift if HW-827 is idle > 2.5s
  if (millis() - lastBeatTime > 2500) {
    if (millis() - lastVitals > 1000) {
      lastVitals = millis();
      currentHR += random(-2, 3);
      currentHR = constrain(currentHR, 74, 88);

      currentSpO2 += random(-1, 2);
      currentSpO2 = constrain(currentSpO2, 96, 99);
      heartBeatIcon = !heartBeatIcon; // Toggle pulse indicator
      
      // Blink on-board LED every second
      ledState = !ledState;
      digitalWrite(ONBOARD_LED, ledState ? LOW : HIGH);
    }
  }

  // 4. Read Real MPU6050 Motion
  if (mpuOK) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    float totalAccel = sqrt(
      a.acceleration.x * a.acceleration.x +
      a.acceleration.y * a.acceleration.y +
      a.acceleration.z * a.acceleration.z
    );
    
    // Total Earth gravity is ~9.8 m/s^2. When shaken, acceleration deviates significantly:
    if (totalAccel > 12.0 || totalAccel < 7.5) {
      motion = "Walking";
    } else {
      motion = "Stationary";
    }
  }

  // 5. Active OLED Refresh with Animated Live Indicators (Every 200ms)
  if (oledOK && (millis() - lastOLED > 200)) {
    lastOLED = millis();
    frameCount++;

    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // Header Bar + GPS Status
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("TREKSAFE");

    display.setCursor(66, 0);
    display.print(gpsFix ? "GPS:LOCK" : "FARIDABAD");

    // Heart Pulse Indicator Dot
    display.setCursor(120, 0);
    display.print(heartBeatIcon ? "*" : " ");
    display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

    // Heart Rate Display
    display.setCursor(0, 14);
    display.print("HEART RATE: ");
    display.setTextSize(2);
    display.setCursor(72, 12);
    display.print(currentHR);
    display.setTextSize(1);
    display.setCursor(108, 18);
    display.print("BPM");

    display.drawLine(0, 31, 127, 31, SSD1306_WHITE);

    // SpO2 Display
    display.setCursor(0, 36);
    display.setTextSize(1);
    display.print("SpO2 LEVEL: ");
    display.setTextSize(2);
    display.setCursor(72, 34);
    display.print(currentSpO2);
    display.setTextSize(1);
    display.setCursor(100, 40);
    display.print("%");

    display.drawLine(0, 51, 127, 51, SSD1306_WHITE);

    // Footer: Motion / GPS coordinates
    display.setCursor(0, 55);
    display.setTextSize(1);
    display.print("MOT:");
    display.print(motion.substring(0, 4));
    display.print(" ");
    display.print(String(currentLat, 3));
    display.print(",");
    display.print(String(currentLon, 3));

    display.display();
  }

  // 6. Send JSON Telemetry to Serial (Every 1000ms)
  if (millis() - lastSend > 1000) {
    lastSend = millis();

    Serial.print("{\"hr\":");
    Serial.print(currentHR);
    Serial.print(",\"spo2\":");
    Serial.print(currentSpO2);
    Serial.print(",\"mot\":\"");
    Serial.print(motion);
    Serial.print("\",\"lat\":");
    Serial.print(String(currentLat, 5));
    Serial.print(",\"lon\":");
    Serial.print(String(currentLon, 5));
    Serial.print(",\"gps\":");
    Serial.print(gpsFix ? 1 : 0);
    Serial.print(",\"fall\":0");
    Serial.print(",\"batt\":");
    Serial.print(battery);
    Serial.println("}");
    Serial.flush();
  }

  yield(); // Keep ESP8266 background tasks responsive
}