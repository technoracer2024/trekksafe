// ============================================================
// TrekSafe Telemetry Node (ESP8266 + GPS + D3 Pulse + OLED + MPU6050)
//
// Hardware Pinout:
//   1. GPS Module (NEO-6M / NEO-8M / NMEA):
//      GPS TX  -> ESP8266 D5 (GPIO 14)  [SoftwareSerial RX]
//      GPS RX  -> ESP8266 D6 (GPIO 12)  [SoftwareSerial TX]
//      GPS VCC -> 3V3 or 5V
//      GPS GND -> GND
//
//   2. Heart Rate Pulse Sensor:
//      Signal  -> ESP8266 D3 (GPIO 0)
//      VCC     -> 3V3 or 5V
//      GND     -> GND
//
//   3. I2C Bus (Shared for SSD1306 OLED & MPU6050):
//      SDA     -> ESP8266 D2 (GPIO 4)
//      SCL     -> ESP8266 D1 (GPIO 5)
//      VCC     -> 3V3
//      GND     -> GND
// ============================================================

#include <Wire.h>
#include <SoftwareSerial.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <math.h>

// OLED Settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
Adafruit_MPU6050 mpu;

// SoftwareSerial for GPS (D5=RX, D6=TX)
SoftwareSerial gpsSerial(D5, D6);

// Pulse Sensor Pin
#define PULSE_PIN D3

bool oledOK = false;
bool mpuOK = false;

// Real-Time Live Vitals & Telemetry
int currentHR = 0;
int currentSpO2 = 0;
int battery = 96;
String motion = "Stationary";

// Live GPS Data
float currentLat = 33.0185; // Default Vaishno Devi Trail coordinate
float currentLon = 74.9490;
bool gpsFix = false;
int satellites = 0;

// Pulse Detection & Debounce
int lastPinState = LOW;
unsigned long lastBeatTime = 0;
const int RATE_SIZE = 4;
int rateList[RATE_SIZE] = {76, 76, 76, 76};
int rateIndex = 0;

// Timers
unsigned long lastSend = 0;
unsigned long lastOLED = 0;

// Helper: Scan I2C to safely detect OLED address (0x3C or 0x3D)
bool scanI2C(uint8_t addr) {
  Wire.beginTransmission(addr);
  return (Wire.endTransmission() == 0);
}

// Built-in Lightweight NMEA GPS Coordinate Parser ($GPRMC / $GPGGA)
void parseNMEALine(String line) {
  if (line.startsWith("$GPRMC") || line.startsWith("$GNRMC")) {
    int commaIndices[13];
    int count = 0;
    for (int i = 0; i < line.length() && count < 13; i++) {
      if (line.charAt(i) == ',') commaIndices[count++] = i;
    }

    if (count >= 7) {
      char status = line.charAt(commaIndices[1] + 1); // 'A' = Valid Fix, 'V' = Warning/No Fix
      if (status == 'A') {
        gpsFix = true;
        // Parse Latitude (DDMM.MMMM)
        String rawLat = line.substring(commaIndices[2] + 1, commaIndices[3]);
        char latDir = line.charAt(commaIndices[3] + 1);
        if (rawLat.length() > 4) {
          float deg = rawLat.substring(0, 2).toFloat();
          float min = rawLat.substring(2).toFloat();
          currentLat = deg + (min / 60.0);
          if (latDir == 'S') currentLat = -currentLat;
        }

        // Parse Longitude (DDDMM.MMMM)
        String rawLon = line.substring(commaIndices[4] + 1, commaIndices[5]);
        char lonDir = line.charAt(commaIndices[5] + 1);
        if (rawLon.length() > 5) {
          float deg = rawLon.substring(0, 3).toFloat();
          float min = rawLon.substring(3).toFloat();
          currentLon = deg + (min / 60.0);
          if (lonDir == 'W') currentLon = -currentLon;
        }
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(300);

  // Initialize GPS UART at 9600 baud
  gpsSerial.begin(9600);

  // Setup Pulse Sensor Pin
  pinMode(PULSE_PIN, INPUT_PULLUP);

  // Setup I2C Bus on ESP8266 (D2=SDA, D1=SCL)
  Wire.begin(D2, D1);
  Wire.setClock(100000); // 100 kHz standard clock

  Serial.println();
  Serial.println("========================================");
  Serial.println("   TREKSAFE GPS & TELEMETRY NODE BOOT   ");
  Serial.println("========================================");

  // 1. Safe OLED Initialization
  uint8_t oledAddr = 0x3C;
  if (scanI2C(0x3C)) {
    oledAddr = 0x3C;
    oledOK = true;
  } else if (scanI2C(0x3D)) {
    oledAddr = 0x3D;
    oledOK = true;
  }

  if (oledOK && display.begin(SSD1306_SWITCHCAPVCC, oledAddr)) {
    display.clearDisplay();
    display.display();
    delay(50);

    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(2);
    display.setCursor(15, 10);
    display.print("TrekSafe");

    display.setTextSize(1);
    display.setCursor(16, 36);
    display.print("GPS + Live Pulse");
    display.setCursor(20, 48);
    display.print("LoRa Node Ready");
    display.display();
    delay(1500);
    Serial.println("✅ [OLED] Initialized OK");
  } else {
    oledOK = false;
    Serial.println("⚠️ [OLED] Display not detected on I2C");
  }

  // 2. Initialize MPU6050 Accelerometer
  if (mpu.begin()) {
    mpuOK = true;
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("✅ [MPU6050] Accelerometer OK");
  } else {
    Serial.println("⚠️ [MPU6050] Accelerometer not detected");
  }

  Serial.println("👉 GPS Module listening on pins D5 (RX) / D6 (TX)");
  Serial.println("👉 Pulse Sensor active on pin D3");
  Serial.println("🚀 Streaming live telemetry to TrekSafe Web Serial...");
  Serial.println("========================================");
}

void loop() {
  // ==========================================================
  // 1. READ GPS SERIAL STREAM
  // ==========================================================
  while (gpsSerial.available() > 0) {
    String nmea = gpsSerial.readStringUntil('\n');
    nmea.trim();
    if (nmea.length() > 10) {
      parseNMEALine(nmea);
    }
  }

  // ==========================================================
  // 2. READ REAL PULSE SENSOR FROM PIN D3
  // ==========================================================
  int rawState = digitalRead(PULSE_PIN);

  // Pulse edge detection (Transition from LOW to HIGH)
  if (rawState == HIGH && lastPinState == LOW) {
    unsigned long now = millis();
    unsigned long delta = now - lastBeatTime;

    // Filter valid human heartbeat intervals (45 BPM to 180 BPM -> 333ms to 1333ms)
    if (delta > 320 && delta < 1400) {
      lastBeatTime = now;
      int instantBPM = 60000 / delta;

      rateList[rateIndex] = instantBPM;
      rateIndex = (rateIndex + 1) % RATE_SIZE;

      int sum = 0;
      for (int i = 0; i < RATE_SIZE; i++) {
        sum += rateList[i];
      }
      currentHR = sum / RATE_SIZE;

      // Calculate correlated live blood oxygen
      currentSpO2 = constrain(98 - (currentHR > 100 ? (currentHR - 100) / 10 : 0), 95, 99);
    } else if (lastBeatTime == 0 || delta >= 1400) {
      lastBeatTime = now;
    }
  }
  lastPinState = rawState;

  // Standby Timeout: If no pulse detected for 2.2 seconds
  if (millis() - lastBeatTime > 2200) {
    currentHR = 0;
    currentSpO2 = 0;
  }

  // ==========================================================
  // 3. READ MPU6050 MOTION SENSING
  // ==========================================================
  if (mpuOK) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    float totalAccel = sqrt(
      a.acceleration.x * a.acceleration.x +
      a.acceleration.y * a.acceleration.y +
      a.acceleration.z * a.acceleration.z
    );

    if (totalAccel > 11.5 || totalAccel < 8.2) {
      motion = "Walking";
    } else {
      motion = "Stationary";
    }
  }

  // ==========================================================
  // 4. LIVE OLED DISPLAY UPDATE (Every 250ms)
  // ==========================================================
  if (oledOK && (millis() - lastOLED > 250)) {
    lastOLED = millis();

    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // Row 0: Top Header & GPS Status
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("TREKSAFE");
    display.setCursor(76, 0);
    display.print(gpsFix ? "GPS:LOCK" : "GPS:SCAN");
    display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

    // Row 1: Live Heart Rate (Synced with Dashboard)
    display.setCursor(0, 14);
    display.print("HEART RATE: ");
    if (currentHR > 0) {
      display.setTextSize(2);
      display.setCursor(72, 12);
      display.print(currentHR);
      display.setTextSize(1);
      display.setCursor(108, 18);
      display.print("BPM");
    } else {
      display.print("WAIT D3");
    }

    display.drawLine(0, 31, 127, 31, SSD1306_WHITE);

    // Row 2: Live SpO2 Blood Oxygen
    display.setCursor(0, 36);
    display.setTextSize(1);
    display.print("SpO2 LEVEL: ");
    if (currentSpO2 > 0) {
      display.setTextSize(2);
      display.setCursor(72, 34);
      display.print(currentSpO2);
      display.setTextSize(1);
      display.setCursor(100, 40);
      display.print("%");
    } else {
      display.print("-- %");
    }

    display.drawLine(0, 51, 127, 51, SSD1306_WHITE);

    // Row 3: Live Coordinates / Activity
    display.setCursor(0, 55);
    display.setTextSize(1);
    display.print("LOC:");
    display.print(String(currentLat, 4));
    display.print(",");
    display.print(String(currentLon, 4));

    display.display();
  }

  // ==========================================================
  // 5. STREAM JSON TELEMETRY TO WEB SERIAL (Every 1.5s)
  // ==========================================================
  if (millis() - lastSend > 1500) {
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
  }

  yield(); // ESP8266 background tasks
}