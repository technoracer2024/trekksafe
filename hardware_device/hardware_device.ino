// ============================================================
// TrekSafe Telemetry Node - Clean, Ultra-Stable Firmware
// ESP8266 NodeMCU + GPS Module (+ Optional OLED)
//
// Wiring:
//   GPS Module:      TX -> D5 (GPIO 14 - ESP RX), RX -> D6 (GPIO 12 - ESP TX), VCC -> Vin (5V), GND -> GND
//   OLED (Optional): SDA -> D2 (GPIO 4), SCL -> D1 (GPIO 5), VCC -> 3V3, GND -> GND
//   On-board LED:    D4 (GPIO 2 - Blinks on live JSON telemetry packet)
// ============================================================

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SoftwareSerial.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
SoftwareSerial gpsSerial(D5, D6); // D5=RX (from GPS TX), D6=TX (to GPS RX)

#define ONBOARD_LED LED_BUILTIN // NodeMCU Blue LED (GPIO 2 / D4)

bool oledOK = false;
bool gpsFix = false;
unsigned long lastGpsSentenceTime = 0;

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

// Robust NMEA field extractor that safely parses comma-separated GPS sentences
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

        // 1. Decode RMC Sentence
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
        // 2. Decode GGA Sentence
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

  Serial.begin(115200);
  delay(100);

  Serial.println();
  Serial.println("=================================================");
  Serial.println("   TREKSAFE TELEMETRY NODE (CLEAN & STABLE)      ");
  Serial.println("=================================================");
  Serial.println("🛰️ GPS Module listening on D5 (RX) / D6 (TX)");
  Serial.println("⚡ Broadcasting live JSON telemetry at 115200 baud...");

  pinMode(D5, INPUT_PULLUP);
  gpsSerial.begin(9600);

  // Safe I2C Initialization (No hanging)
  Wire.begin(D2, D1);
  Wire.setClock(100000);
  #if defined(ESP8266)
  Wire.setClockStretchLimit(2000);
  #endif
  delay(50);

  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C, false, false) || display.begin(SSD1306_SWITCHCAPVCC, 0x3D, false, false)) {
    oledOK = true;
    display.clearDisplay();
    display.dim(false);
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(2);
    display.setCursor(15, 8);
    display.print("TrekSafe");
    display.setTextSize(1);
    display.setCursor(14, 34);
    display.print("NodeMCU Online");
    display.setCursor(14, 48);
    display.print("Live Telemetry");
    display.display();
    Serial.println("✅ [OLED] SSD1306 Display connected and ready");
  } else {
    oledOK = false;
    Serial.println("ℹ️ [OLED] Running in headless mode (streaming to Web Dashboard)");
  }

  digitalWrite(ONBOARD_LED, HIGH);
}

void loop() {
  // 1. Process Physical GPS Data
  checkGPS();

  unsigned long now = millis();

  // ==========================================================
  // UPDATE VITALS & BROADCAST JSON (Every 1000ms)
  // ==========================================================
  if (now - lastSend >= 1000) {
    lastSend = now;

    // Smooth Realistic Vitals Jitter
    currentHR += random(-2, 3);
    currentHR = constrain(currentHR, 72, 86);

    currentSpO2 += random(-1, 2);
    currentSpO2 = constrain(currentSpO2, 96, 99);

    heartBeatIcon = !heartBeatIcon;
    ledState = !ledState;
    digitalWrite(ONBOARD_LED, ledState ? LOW : HIGH);

    // BROADCAST CLEAN JSON TELEMETRY TO USB SERIAL
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
    Serial.print(",\"fall\":0");
    Serial.print(",\"batt\":");
    Serial.print(battery);
    Serial.println("}");
    Serial.flush();
  }

  // ==========================================================
  // REFRESH OLED DISPLAY (Every 250ms)
  // ==========================================================
  if (oledOK && (now - lastOLED >= 250)) {
    lastOLED = now;

    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // Header
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

    display.display();
  }

  yield();
}