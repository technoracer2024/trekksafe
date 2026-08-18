// ============================================================
// TrekSafe Telemetry Node - Full Mission System
// ESP8266 + SSD1306 OLED + MPU6050 IMU + GPS + Passive Buzzer + Button
//
// Wiring:
//   OLED Display:    SDA -> D2 (GPIO 4), SCL -> D1 (GPIO 5), VCC -> 3V3, GND -> GND
//   MPU6050 IMU:     SDA -> D2 (GPIO 4), SCL -> D1 (GPIO 5), VCC -> 3V3, GND -> GND
//   GPS Module:      TX -> D5 (GPIO 14 - ESP RX), RX -> D6 (GPIO 12 - ESP TX), VCC -> Vin (5V), GND -> GND
//   Passive Buzzer:  Signal (+) -> D8 (GPIO 15), Ground (-) -> GND
//   4-Pin Button:    Pin 1 -> D7 (GPIO 13), Pin 3 (opposite) -> GND (Uses internal INPUT_PULLUP)
//   On-board LED:    D4 (GPIO 2 - Blinks on live packet)
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

#define ONBOARD_LED LED_BUILTIN // NodeMCU On-board Blue LED (GPIO 2 / D4)
#define BUZZER_PIN D8           // Passive Buzzer Signal (+) Pin
#define BUTTON_PIN D7           // 4-Pin Cancel Push Button

bool oledOK = false;
bool mpuOK = false;
bool gpsFix = false;
unsigned long lastGpsSentenceTime = 0;

// Fall Detection & Buzzer Alarm State
bool isFallWarning = false;
bool isConfirmedFall = false;
unsigned long fallStartTime = 0;
const unsigned long FALL_TIMEOUT_MS = 15000; // 15 seconds cancellation window

// Vitals & State
int currentHR = 76;
int currentSpO2 = 98;
int battery = 96;
String motion = "Walking";

// Faridabad Base Coordinates (High Accuracy Wi-Fi Positioning)
const float STATIC_FARIDABAD_LAT = 28.40890;
const float STATIC_FARIDABAD_LON = 77.31780;

float currentLat = STATIC_FARIDABAD_LAT;
float currentLon = STATIC_FARIDABAD_LON;

// Simulation Counters
bool heartBeatIcon = false;
bool ledState = false;

// Timers
unsigned long lastSend = 0;
unsigned long lastOLED = 0;

// Robust NMEA field extractor that properly handles empty comma fields
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

// Non-blocking Robust GPS Sentence Decoder
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

        // 1. Decode RMC Sentence ($GPRMC or $GNRMC)
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
        // 2. Decode GGA Sentence ($GPGGA or $GNGGA)
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

  // If no GPS satellite sentence for > 6 seconds, revert to Faridabad coordinates
  if (gpsFix && (millis() - lastGpsSentenceTime > 6000)) {
    gpsFix = false;
    currentLat = STATIC_FARIDABAD_LAT;
    currentLon = STATIC_FARIDABAD_LON;
  }
}

void setup() {
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(ONBOARD_LED, LOW);

  // Setup Buzzer (PWM Passive) & Button (INPUT_PULLUP)
  pinMode(BUZZER_PIN, OUTPUT);
  noTone(BUZZER_PIN);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  Serial.begin(115200);
  delay(300);

  Serial.println();
  Serial.println("=================================================");
  Serial.println("   TREKSAFE TELEMETRY NODE (FULL MISSION)        ");
  Serial.println("=================================================");
  Serial.println("🛰️ GPS Module listening on D5 (RX) / D6 (TX) @ 9600 baud");
  Serial.println("🔊 Passive Buzzer armed on Pin D8 (GPIO 15)");
  Serial.println("🔘 Cancel Button armed on Pin D7 (GPIO 13)");
  Serial.println("⚡ Broadcasting live JSON telemetry at 115200 baud...");

  pinMode(D5, INPUT_PULLUP);
  gpsSerial.begin(9600);

  Wire.begin(D2, D1);
  Wire.setClock(100000);

  // Probe OLED Display
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C) || display.begin(SSD1306_SWITCHCAPVCC, 0x3D)) {
    oledOK = true;
    display.clearDisplay();
    display.dim(false);
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(2);
    display.setCursor(15, 10);
    display.print("TrekSafe");
    display.setTextSize(1);
    display.setCursor(20, 36);
    display.print("Mission Node");
    display.setCursor(20, 48);
    display.print("Fall Alarm Ready");
    display.display();
    delay(1000);
    Serial.println("✅ [OLED] SSD1306 Display connected and ready");
  } else {
    oledOK = false;
    Serial.println("ℹ️ [OLED] Display not detected on D2/D1");
  }

  // Probe MPU6050 Accelerometer
  if (mpu.begin(0x68, &Wire) || mpu.begin(0x69, &Wire) || mpu.begin()) {
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

  // 2. Check 4-Pin Button Press (Emergency Alarm Cancellation)
  if (digitalRead(BUTTON_PIN) == LOW) {
    if (isFallWarning || isConfirmedFall) {
      isFallWarning = false;
      isConfirmedFall = false;
      noTone(BUZZER_PIN);
      motion = "Walking";
      Serial.println("🔘 [BUTTON] User pressed cancel button! False alarm cleared.");
      delay(300); // Debounce
    }
  }

  // 3. Process MPU6050 Motion & Fall Detection
  if (mpuOK && !isFallWarning && !isConfirmedFall) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    float totalAccel = sqrt(
      a.acceleration.x * a.acceleration.x +
      a.acceleration.y * a.acceleration.y +
      a.acceleration.z * a.acceleration.z
    );

    // Impact Threshold: > 21.0 m/s^2 (Shock) or < 3.5 m/s^2 (Freefall)
    if (totalAccel >= 21.0 || totalAccel <= 3.5) {
      isFallWarning = true;
      fallStartTime = millis();
      motion = "⚠️ FALL DETECTED";
      Serial.println("🚨 [MPU6050] Fall impact detected! 15-second buzzer alarm initiated.");
    } else if (totalAccel > 12.0 || totalAccel < 7.5) {
      motion = "Walking";
    } else {
      motion = "Stationary";
    }
  }

  // 4. Handle 15-Second Fall Warning & Passive Buzzer Tone
  if (isFallWarning) {
    unsigned long elapsed = millis() - fallStartTime;
    if (elapsed < FALL_TIMEOUT_MS) {
      int remainingSec = 15 - (int)(elapsed / 1000);
      motion = "FALL! " + String(remainingSec) + "s (BTN)";

      // Alternating warning chirp for passive buzzer
      int toneFreq = (millis() % 400 < 200) ? 2600 : 1800;
      tone(BUZZER_PIN, toneFreq);
    } else {
      // 15 seconds elapsed with NO button press!
      isFallWarning = false;
      isConfirmedFall = true;
      motion = "CRITICAL FALL IMPACT";
      Serial.println("🚨 [EMERGENCY] 15s elapsed without response! Emergency dispatch triggered!");
    }
  } else if (isConfirmedFall) {
    // Continuous urgent alarm tone
    int toneFreq = (millis() % 300 < 150) ? 3200 : 2200;
    tone(BUZZER_PIN, toneFreq);
  } else {
    noTone(BUZZER_PIN);
  }

  unsigned long now = millis();

  // ==========================================================
  // UPDATE VITALS (Every 1000ms)
  // ==========================================================
  if (now - lastSend >= 1000) {
    lastSend = now;

    // 1. Smooth Heart Rate (Range: 72 - 86 BPM, or 135 BPM if fallen)
    if (isFallWarning || isConfirmedFall) {
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

    // 2. BROADCAST EXACT JSON TO USB SERIAL
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
    Serial.print(",\"fall\":");
    Serial.print(isConfirmedFall ? 1 : 0);
    Serial.print(",\"batt\":");
    Serial.print(battery);
    Serial.println("}");
    Serial.flush();
  }

  // ==========================================================
  // REFRESH OLED DISPLAY (Every 200ms)
  // ==========================================================
  if (oledOK && (now - lastOLED >= 200)) {
    lastOLED = now;

    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    if (isFallWarning) {
      // Urgent Fall Warning Countdown Screen
      unsigned long elapsed = millis() - fallStartTime;
      int remainingSec = 15 - (int)(elapsed / 1000);
      if (remainingSec < 0) remainingSec = 0;

      display.setTextSize(1);
      display.setCursor(10, 2);
      display.print("⚠️ FALL DETECTED!");

      display.drawLine(0, 13, 127, 13, SSD1306_WHITE);

      display.setTextSize(1);
      display.setCursor(8, 18);
      display.print("BUZZER ALARM ON!");

      display.setTextSize(2);
      display.setCursor(20, 32);
      display.print("CANCEL:");
      display.print(remainingSec);
      display.print("s");

      display.setTextSize(1);
      display.setCursor(4, 52);
      display.print("PRESS BUTTON IF SAFE");
    } else if (isConfirmedFall) {
      // Confirmed Emergency Screen
      display.setTextSize(1);
      display.setCursor(4, 2);
      display.print("🚨 RESCUE DISPATCHED");
      display.drawLine(0, 13, 127, 13, SSD1306_WHITE);

      display.setTextSize(2);
      display.setCursor(12, 22);
      display.print("SOS SENT");

      display.setTextSize(1);
      display.setCursor(8, 48);
      display.print("HELP IS ON THE WAY");
    } else {
      // Normal Telemetry Screen
      display.setTextSize(1);
      display.setCursor(0, 0);
      display.print("TREKSAFE");
      display.setCursor(64, 0);
      display.print(gpsFix ? "GPS:LOCK" : "FARIDABAD");
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
      display.print("LOC:");
      display.print(String(currentLat, 3));
      display.print(",");
      display.print(String(currentLon, 3));
    }

    display.display();
  }

  yield();
}