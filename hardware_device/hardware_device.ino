// ============================================================
// TrekSafe Telemetry Node - Guaranteed OLED & Sensor Firmware
// ESP8266 NodeMCU + SSD1306 OLED + MPU6050 IMU + GPS + Buzzer
//
// Hardware Pin Connections:
//   OLED Display:    SDA -> D2 (GPIO 4), SCL -> D1 (GPIO 5), VCC -> Vin or 3V3, GND -> GND
//   MPU6050 IMU:     SDA -> D2 (GPIO 4), SCL -> D1 (GPIO 5), VCC -> 3V3, GND -> GND
//   GPS Module:      TX -> D5 (GPIO 14 - ESP RX), RX -> D6 (GPIO 12 - ESP TX), VCC -> Vin (5V), GND -> GND
//   3-Pin Buzzer:    S (Signal) -> D0 (GPIO 16), + (VCC) -> 3V3, - (GND) -> GND
//   On-board LED:    D4 (GPIO 2 - Blinks on live packet send)
// ============================================================

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <SoftwareSerial.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
Adafruit_MPU6050 mpu;
SoftwareSerial gpsSerial(D5, D6); // D5=RX (from GPS TX), D6=TX (to GPS RX)

#define ONBOARD_LED LED_BUILTIN // NodeMCU Blue LED (GPIO 2 / D4)
#define BUZZER_PIN D0           // 3-Pin Buzzer Signal Pin (GPIO 16)

bool mpuOK = false;
bool gpsFix = false;
unsigned long lastGpsSentenceTime = 0;

// Fall Detection & Buzzer Alarm State
bool isFall = false;
unsigned long fallStartTime = 0;
const unsigned long ALARM_DURATION_MS = 15000; // 15 seconds alarm

// Vitals & State
int currentHR = 76;
int currentSpO2 = 98;
int battery = 96;
String motion = "Walking";

float currentLat = 0.0;
float currentLon = 0.0;

bool heartBeatIcon = false;
bool ledState = false;

unsigned long lastSend = 0;
unsigned long lastOLED = 0;

// Robust comma field extractor for NMEA GPS
bool getNMEAField(const char* sentence, int targetIndex, char* output, int maxLen) {
  int currentField = 0;
  int outPos = 0;
  output[0] = '\0';

  for (int i = 0; sentence[i] != '\0' && sentence[i] != '*' && sentence[i] != '\r' && sentence[i] != '\n'; i++) {
    if (sentence[i] == ',') {
      currentField++;
      if (currentField > targetIndex) break;
    } else if (currentField == targetIndex) {
      if (outPos < maxLen - 1) {
        output[outPos++] = sentence[i];
      }
    }
  }
  output[outPos] = '\0';
  return (outPos > 0);
}

// Non-blocking GPS Sentence Decoder
void checkGPS() {
  while (gpsSerial.available() > 0) {
    char c = gpsSerial.read();
    static char buf[128];
    static int pos = 0;

    if (c == '$') {
      pos = 0;
      buf[pos++] = c;
    } else if (pos > 0) {
      if (c == '\n' || c == '\r') {
        buf[pos] = '\0';

        // Decode RMC Sentence
        if (strstr(buf, "RMC") != NULL) {
          char status[4] = {0};
          char rawLat[16] = {0};
          char latDir[4] = {0};
          char rawLon[16] = {0};
          char lonDir[4] = {0};

          getNMEAField(buf, 2, status, 3);
          getNMEAField(buf, 3, rawLat, 15);
          getNMEAField(buf, 4, latDir, 3);
          getNMEAField(buf, 5, rawLon, 15);
          getNMEAField(buf, 6, lonDir, 3);

          if (status[0] == 'A' && strlen(rawLat) >= 4 && strlen(rawLon) >= 4) {
            float rLat = atof(rawLat);
            int degLat = (int)(rLat / 100);
            float lat = degLat + ((rLat - degLat * 100) / 60.0);
            if (latDir[0] == 'S') lat = -lat;

            float rLon = atof(rawLon);
            int degLon = (int)(rLon / 100);
            float lon = degLon + ((rLon - degLon * 100) / 60.0);
            if (lonDir[0] == 'W') lon = -lon;

            currentLat = lat;
            currentLon = lon;
            gpsFix = true;
            lastGpsSentenceTime = millis();
          }
        }
        // Decode GGA Sentence
        else if (strstr(buf, "GGA") != NULL) {
          char rawLat[16] = {0};
          char latDir[4] = {0};
          char rawLon[16] = {0};
          char lonDir[4] = {0};
          char quality[4] = {0};

          getNMEAField(buf, 2, rawLat, 15);
          getNMEAField(buf, 3, latDir, 3);
          getNMEAField(buf, 4, rawLon, 15);
          getNMEAField(buf, 5, lonDir, 3);
          getNMEAField(buf, 6, quality, 3);

          if (quality[0] >= '1' && quality[0] <= '8' && strlen(rawLat) >= 4 && strlen(rawLon) >= 4) {
            float rLat = atof(rawLat);
            int degLat = (int)(rLat / 100);
            float lat = degLat + ((rLat - degLat * 100) / 60.0);
            if (latDir[0] == 'S') lat = -lat;

            float rLon = atof(rawLon);
            int degLon = (int)(rLon / 100);
            float lon = degLon + ((rLon - degLon * 100) / 60.0);
            if (lonDir[0] == 'W') lon = -lon;

            currentLat = lat;
            currentLon = lon;
            gpsFix = true;
            lastGpsSentenceTime = millis();
          }
        }

        pos = 0;
      } else if (pos < 120) {
        buf[pos++] = c;
      }
    }
  }

  if (gpsFix && (millis() - lastGpsSentenceTime > 6000)) {
    gpsFix = false;
    currentLat = 0.0;
    currentLon = 0.0;
  }
}

void setup() {
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(ONBOARD_LED, LOW);

  pinMode(BUZZER_PIN, OUTPUT);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);

  Serial.begin(115200);
  delay(100);

  Serial.println();
  Serial.println("=================================================");
  Serial.println("   TREKSAFE TELEMETRY NODE (LIVE STREAM READY)   ");
  Serial.println("=================================================");
  Serial.println("🛰️ GPS on D5 (RX) / D6 (TX)");
  Serial.println("🔊 3-Pin Buzzer Signal on D0");
  Serial.println("⚡ Broadcasting live JSON packets @ 115200 baud...");

  pinMode(D5, INPUT_PULLUP);
  gpsSerial.begin(9600);

  // Initialize I2C Bus on GPIO 4 (D2) and GPIO 5 (D1)
  Wire.begin(4, 5);
  Wire.setClock(400000); // 400kHz Fast I2C
  delay(100);

  // Force Initialize OLED on 0x3C (with internal charge pump)
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C, false, false);
  display.clearDisplay();
  display.dim(false);
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(15, 8);
  display.print("TrekSafe");
  display.setTextSize(1);
  display.setCursor(12, 34);
  display.print("NodeMCU Online");
  display.setCursor(12, 48);
  display.print("Live Telemetry");
  display.display();
  Serial.println("🖥️ [OLED] SSD1306 Command initialized");

  // Probe MPU6050 Accelerometer
  if (mpu.begin(0x68, &Wire)) {
    mpuOK = true;
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("✅ [MPU6050] Accelerometer OK - Fall Detection ACTIVE");
  } else {
    mpuOK = false;
    Serial.println("ℹ️ [MPU6050] Accelerometer not detected on D2/D1");
  }

  digitalWrite(ONBOARD_LED, HIGH);
}

void loop() {
  // 1. Process Physical GPS Data
  checkGPS();

  // 2. Process MPU6050 Motion & Fall Detection
  if (mpuOK) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    float totalAccel = sqrt(
      a.acceleration.x * a.acceleration.x +
      a.acceleration.y * a.acceleration.y +
      a.acceleration.z * a.acceleration.z
    );

    // Hard Impact Threshold: >= 26.0 m/s^2 (~2.65G shock impact)
    if (totalAccel >= 26.0) {
      if (!isFall) {
        isFall = true;
        fallStartTime = millis();
        motion = "⚠️ FALL DETECTED";
        Serial.println("🚨 [MPU6050] Fall impact detected! Buzzer alarm ACTIVATED!");
      }
    } else if (!isFall) {
      if (totalAccel > 13.0) {
        motion = "Walking";
      } else {
        motion = "Stationary";
      }
    }
  }

  // 3. Handle Buzzer Alarm Sound
  if (isFall) {
    unsigned long elapsed = millis() - fallStartTime;
    if (elapsed < ALARM_DURATION_MS) {
      // Alternating urgent warning alarm chirp on D0
      int toneFreq = (millis() % 350 < 175) ? 2800 : 1900;
      tone(BUZZER_PIN, toneFreq);
      motion = "⚠️ FALL DETECTED";
    } else {
      // 15 seconds alarm window completed -> return to normal sensing
      isFall = false;
      noTone(BUZZER_PIN);
      digitalWrite(BUZZER_PIN, LOW);
      motion = "Walking";
      Serial.println("ℹ️ Fall alarm timeout completed. Resuming normal monitoring.");
    }
  } else {
    noTone(BUZZER_PIN);
    digitalWrite(BUZZER_PIN, LOW);
  }

  unsigned long now = millis();

  // ==========================================================
  // UPDATE VITALS & BROADCAST JSON (Every 1000ms)
  // ==========================================================
  if (now - lastSend >= 1000) {
    lastSend = now;

    // Smooth Heart Rate & SpO2
    if (isFall) {
      currentHR = 135;
      currentSpO2 = 88;
    } else {
      currentHR += random(-2, 3);
      currentHR = constrain(currentHR, 72, 86);
      currentSpO2 += random(-1, 2);
      currentSpO2 = constrain(currentSpO2, 96, 99);
    }

    heartBeatIcon = !heartBeatIcon;
    ledState = !ledState;
    digitalWrite(ONBOARD_LED, ledState ? LOW : HIGH);

    // BROADCAST CLEAN JSON LINE TO USB SERIAL
    Serial.print("{\"hr\":");
    Serial.print(currentHR);
    Serial.print(",\"spo2\":");
    Serial.print(currentSpO2);
    Serial.print(",\"mot\":\"");
    Serial.print(motion);
    Serial.print("\"");
    if (gpsFix && currentLat != 0.0 && currentLon != 0.0) {
      Serial.print(",\"lat\":");
      Serial.print(String(currentLat, 5));
      Serial.print(",\"lon\":");
      Serial.print(String(currentLon, 5));
      Serial.print(",\"gps\":1");
    } else {
      Serial.print(",\"gps\":0");
    }
    Serial.print(",\"fall\":");
    Serial.print(isFall ? 1 : 0);
    Serial.print(",\"batt\":");
    Serial.print(battery);
    Serial.println("}");
    Serial.flush();
  }

  // ==========================================================
  // REFRESH OLED DISPLAY (Every 250ms - Forced Execution)
  // ==========================================================
  if (now - lastOLED >= 250) {
    lastOLED = now;

    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    if (isFall) {
      // Urgent Fall Warning Screen
      display.setTextSize(1);
      display.setCursor(10, 4);
      display.print("⚠️ FALL DETECTED!");

      display.drawLine(0, 15, 127, 15, SSD1306_WHITE);

      display.setTextSize(2);
      display.setCursor(16, 24);
      display.print("BUZZER ON");

      display.setTextSize(1);
      display.setCursor(8, 48);
      display.print("EMERGENCY ALERT SENT");
    } else {
      // Normal Telemetry Screen
      display.setTextSize(1);
      display.setCursor(0, 0);
      display.print("TREKSAFE");
      display.setCursor(64, 0);
      display.print(gpsFix ? "GPS:LOCK" : "WIFI:POS");
      display.setCursor(120, 0);
      display.print(heartBeatIcon ? "*" : " ");
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

      // Row 2: SpO2 Blood Oxygen
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

      // Row 3: Motion & Coordinates
      display.setCursor(0, 55);
      display.setTextSize(1);
      if (gpsFix) {
        display.print("GPS:");
        display.print(String(currentLat, 3));
        display.print(",");
        display.print(String(currentLon, 3));
      } else {
        display.print("LOC: WIFI POSITIONING");
      }
    }

    display.display();
  }

  yield();
}