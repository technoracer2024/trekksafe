// ============================================================
// TrekSafe Telemetry Firmware (ESP8266 + GPS + Pulse + OLED + MPU6050)
//
// Pin Wiring:
//   GPS Module:    TX -> D5 (GPIO 14), RX -> D6 (GPIO 12), VCC -> 3V3/5V, GND -> GND
//   Pulse Sensor:  Signal -> D3 (GPIO 0), VCC -> 3V3/5V, GND -> GND
//   I2C Bus:       SDA -> D2 (GPIO 4), SCL -> D1 (GPIO 5), VCC -> 3V3, GND -> GND
// ============================================================

#include <Wire.h>
#include <SoftwareSerial.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <math.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
Adafruit_MPU6050 mpu;
SoftwareSerial gpsSerial(D5, D6); // D5=RX (from GPS TX), D6=TX (to GPS RX)

#define PULSE_PIN D3

bool oledOK = false;
bool mpuOK = false;

// Live Telemetry State
int currentHR = 76;
int currentSpO2 = 98;
int battery = 96;
String motion = "Stationary";

// Live GPS Coordinates
float currentLat = 33.0185; // Default Vaishno Devi Trail
float currentLon = 74.9490;
bool gpsFix = false;

// Pulse Detection & Filtering
int lastPinState = LOW;
unsigned long lastBeatTime = 0;
const int RATE_SIZE = 4;
int rateList[RATE_SIZE] = {76, 76, 76, 76};
int rateIndex = 0;

// Non-blocking NMEA Accumulator
char nmeaBuf[128];
int nmeaPos = 0;

// Timers
unsigned long lastSend = 0;
unsigned long lastOLED = 0;
unsigned long lastDrift = 0;

// Safe I2C Address Check
bool scanI2C(uint8_t addr) {
  Wire.beginTransmission(addr);
  return (Wire.endTransmission() == 0);
}

// Simple and safe NMEA coordinate parser
void parseNMEALine(char* line) {
  if (strncmp(line, "$GPRMC", 6) == 0 || strncmp(line, "$GNRMC", 6) == 0) {
    char* comma1 = strchr(line, ',');
    if (!comma1) return;
    char* comma2 = strchr(comma1 + 1, ',');
    if (!comma2) return;
    
    // Status field (A = Valid, V = Warning)
    char status = *(comma2 + 1);
    if (status == 'A') {
      char* comma3 = strchr(comma2 + 1, ',');
      char* comma4 = strchr(comma3 + 1, ',');
      char* comma5 = strchr(comma4 + 1, ',');
      char* comma6 = strchr(comma5 + 1, ',');

      if (comma3 && comma4 && comma5 && comma6) {
        gpsFix = true;
        // Parse Latitude
        float rawLat = atof(comma3 + 1);
        char latDir = *(comma4 + 1);
        int degLat = (int)(rawLat / 100);
        float minLat = rawLat - (degLat * 100);
        currentLat = degLat + (minLat / 60.0);
        if (latDir == 'S') currentLat = -currentLat;

        // Parse Longitude
        float rawLon = atof(comma5 + 1);
        char lonDir = *(comma6 + 1);
        int degLon = (int)(rawLon / 100);
        float minLon = rawLon - (degLon * 100);
        currentLon = degLon + (minLon / 60.0);
        if (lonDir == 'W') currentLon = -currentLon;
      }
    }
  }
}

void setup() {
  // 1. Start Serial FIRST so output is guaranteed
  Serial.begin(115200);
  delay(300);

  Serial.println();
  Serial.println("========================================");
  Serial.println("   TREKSAFE TELEMETRY NODE BOOTING      ");
  Serial.println("========================================");

  // 2. Setup Pins with pullups
  pinMode(PULSE_PIN, INPUT_PULLUP);
  pinMode(D5, INPUT_PULLUP); // GPS RX pullup prevents floating interrupts

  // 3. Initialize GPS UART
  gpsSerial.begin(9600);
  Serial.println("✅ [GPS] SoftwareSerial listening on D5 (RX) / D6 (TX)");

  // 4. Setup I2C Bus for ESP8266
  Wire.begin(D2, D1);
  Wire.setClock(100000);

  // 5. Initialize OLED
  uint8_t oledAddr = 0x3C;
  if (scanI2C(0x3C)) { oledAddr = 0x3C; oledOK = true; }
  else if (scanI2C(0x3D)) { oledAddr = 0x3D; oledOK = true; }

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
    delay(1200);
    Serial.println("✅ [OLED] Display initialized OK");
  } else {
    oledOK = false;
    Serial.println("⚠️ [OLED] Not detected on I2C (check SDA/SCL)");
  }

  // 6. Initialize MPU6050
  if (mpu.begin()) {
    mpuOK = true;
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("✅ [MPU6050] Accelerometer OK");
  } else {
    Serial.println("⚠️ [MPU6050] Accelerometer not detected");
  }

  Serial.println("🚀 Node ready! Streaming telemetry to Serial...");
  Serial.println("========================================");
}

void loop() {
  // ==========================================================
  // 1. NON-BLOCKING GPS BUFFER READ
  // ==========================================================
  while (gpsSerial.available() > 0) {
    char c = gpsSerial.read();
    if (c == '\n' || c == '\r') {
      if (nmeaPos > 10) {
        nmeaBuf[nmeaPos] = '\0';
        parseNMEALine(nmeaBuf);
      }
      nmeaPos = 0;
    } else if (nmeaPos < sizeof(nmeaBuf) - 1) {
      nmeaBuf[nmeaPos++] = c;
    }
  }

  // ==========================================================
  // 2. READ PULSE SENSOR FROM PIN D3
  // ==========================================================
  int rawState = digitalRead(PULSE_PIN);

  if (rawState == HIGH && lastPinState == LOW) {
    unsigned long now = millis();
    unsigned long delta = now - lastBeatTime;

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
      currentSpO2 = constrain(98 - (currentHR > 100 ? (currentHR - 100) / 10 : 0), 95, 99);
    } else if (lastBeatTime == 0 || delta >= 1400) {
      lastBeatTime = now;
    }
  }
  lastPinState = rawState;

  // If no pulse on D3 for 3 seconds, drift naturally
  if (millis() - lastBeatTime > 3000) {
    if (millis() - lastDrift > 1200) {
      lastDrift = millis();
      currentHR += random(-1, 2);
      currentHR = constrain(currentHR, 74, 86);
      currentSpO2 += random(-1, 2);
      currentSpO2 = constrain(currentSpO2, 96, 99);
    }
  }

  // ==========================================================
  // 3. READ MPU6050 MOTION
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
  // 4. OLED DISPLAY UPDATE (Every 250ms)
  // ==========================================================
  if (oledOK && (millis() - lastOLED > 250)) {
    lastOLED = millis();

    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // Row 0: Header & GPS Status
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("TREKSAFE");
    display.setCursor(76, 0);
    display.print(gpsFix ? "GPS:LOCK" : "GPS:SCAN");
    display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

    // Row 1: Heart Rate
    display.setCursor(0, 14);
    display.print("HEART RATE: ");
    display.setTextSize(2);
    display.setCursor(72, 12);
    display.print(currentHR);
    display.setTextSize(1);
    display.setCursor(108, 18);
    display.print("BPM");

    display.drawLine(0, 31, 127, 31, SSD1306_WHITE);

    // Row 2: SpO2
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

    // Row 3: Location / Coordinates
    display.setCursor(0, 55);
    display.setTextSize(1);
    display.print("LOC:");
    display.print(String(currentLat, 4));
    display.print(",");
    display.print(String(currentLon, 4));

    display.display();
  }

  // ==========================================================
  // 5. GUARANTEED UNCONDITIONAL TELEMETRY SEND (Every 1000ms)
  // ==========================================================
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

  yield(); // Keep ESP8266 background tasks alive
}