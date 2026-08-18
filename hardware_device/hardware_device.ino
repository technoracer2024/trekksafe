// ============================================================
// TrekSafe Telemetry Node - Strict GPS with Static Faridabad Fallback
// ESP8266 + SSD1306 OLED Display (I2C) + GPS Module (UART)
//
// Wiring:
//   OLED Display:    SDA -> D2 (GPIO 4), SCL -> D1 (GPIO 5), VCC -> 3V3, GND -> GND
//   GPS Module:      TX -> D5 (GPIO 14 - ESP RX), RX -> D6 (GPIO 12 - ESP TX), VCC -> Vin/5V, GND -> GND
//   On-board LED:    D4 (GPIO 2 - Blinks on live packet)
//
// Behavior:
//   1. Physical GPS is primary: decodes real satellites from NEO-6M on D5/D6.
//   2. If GPS has no fix (e.g. searching), holds STRICT STATIC Faridabad position (28.40890, 77.31780).
//   3. No simulated drift or random location changes.
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

#define ONBOARD_LED LED_BUILTIN // NodeMCU On-board Blue LED (GPIO 2 / D4)

bool oledOK = false;
bool gpsFix = false;
unsigned long lastGpsSentenceTime = 0;

// Simulated Vitals
int currentHR = 76;
int currentSpO2 = 98;
int battery = 96;
String motion = "Walking";

// Faridabad Static Base Coordinates
const float STATIC_FARIDABAD_LAT = 28.40890;
const float STATIC_FARIDABAD_LON = 77.31780;

float currentLat = STATIC_FARIDABAD_LAT;
float currentLon = STATIC_FARIDABAD_LON;

// Simulation Counters
int motionCycle = 0;
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

  // If no GPS satellite sentence for > 6 seconds, revert to static Faridabad coordinates
  if (gpsFix && (millis() - lastGpsSentenceTime > 6000)) {
    gpsFix = false;
    currentLat = STATIC_FARIDABAD_LAT;
    currentLon = STATIC_FARIDABAD_LON;
  }
}

void setup() {
  // 1. Initialize On-board Blue LED
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(ONBOARD_LED, LOW); // Turn LED ON at boot

  // 2. Initialize Hardware Serial at 115200 baud
  Serial.begin(115200);
  delay(300);

  Serial.println();
  Serial.println("=================================================");
  Serial.println("   TREKSAFE GPS TELEMETRY NODE (ESP8266)         ");
  Serial.println("=================================================");
  Serial.println("🛰️ GPS Module listening on D5 (RX) / D6 (TX) @ 9600 baud");
  Serial.println("📍 Fallback: Static Faridabad (28.40890, 77.31780)");
  Serial.println("⚡ Broadcasting live JSON telemetry at 115200 baud...");

  // 3. Initialize GPS Software UART
  pinMode(D5, INPUT_PULLUP);
  gpsSerial.begin(9600);

  // 4. Initialize I2C Bus: SDA=D2 (GPIO 4), SCL=D1 (GPIO 5)
  Wire.begin(D2, D1);
  Wire.setClock(100000); // 100 kHz standard clock

  // 5. Probe & Initialize OLED Display (Non-blocking)
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C) || display.begin(SSD1306_SWITCHCAPVCC, 0x3D)) {
    oledOK = true;
    display.clearDisplay();
    display.dim(false); // Maximum brightness
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(2);
    display.setCursor(15, 10);
    display.print("TrekSafe");

    display.setTextSize(1);
    display.setCursor(20, 36);
    display.print("Faridabad Node");
    display.setCursor(20, 48);
    display.print("GPS Telemetry");
    display.display();
    delay(1000);
    Serial.println("✅ [OLED] SSD1306 Display connected and ready");
  } else {
    oledOK = false;
    Serial.println("ℹ️ [OLED] Display not detected on D2/D1 (Serial stream still active)");
  }

  digitalWrite(ONBOARD_LED, HIGH); // Turn LED OFF after boot
  Serial.println("🚀 Telemetry active! Connect TrekSafe Web Serial now.");
  Serial.println("=================================================");
}

void loop() {
  // 1. Process Physical GPS Data (Non-blocking)
  checkGPS();

  unsigned long now = millis();

  // ==========================================================
  // UPDATE VITALS (Every 1000ms)
  // ==========================================================
  if (now - lastSend >= 1000) {
    lastSend = now;

    // 1. Smooth Heart Rate (Range: 72 - 86 BPM)
    currentHR += random(-2, 3);
    currentHR = constrain(currentHR, 72, 86);

    // 2. SpO2 (Range: 96% - 99%)
    currentSpO2 += random(-1, 2);
    currentSpO2 = constrain(currentSpO2, 96, 99);

    // 3. Motion Cycle (10s Walking, 5s Stationary)
    motionCycle = (motionCycle + 1) % 15;
    motion = (motionCycle < 10) ? "Walking" : "Stationary";

    // Toggle live heart icon & LED pulse
    heartBeatIcon = !heartBeatIcon;
    ledState = !ledState;
    digitalWrite(ONBOARD_LED, ledState ? LOW : HIGH);

    // 4. BROADCAST EXACT JSON TO USB SERIAL
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

  // ==========================================================
  // REFRESH OLED DISPLAY (Every 200ms)
  // ==========================================================
  if (oledOK && (now - lastOLED >= 200)) {
    lastOLED = now;

    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // Row 0: Top Header & Location Mode Indicator
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

    display.display();
  }

  yield(); // Keep ESP8266 background tasks responsive
}