// ============================================================
// TrekSafe Telemetry Node - Fully Simulated Sensor Firmware
// ESP8266 + SSD1306 OLED Display (I2C)
//
// Wiring for OLED Display:
//   SDA -> D2 (GPIO 4)
//   SCL -> D1 (GPIO 5)
//   VCC -> 3V3
//   GND -> GND
//
// Features:
//   - Simulates realistic Heart Rate (72 - 86 BPM)
//   - Simulates realistic SpO2 (96% - 99%)
//   - Simulates realistic Motion ("Walking" / "Stationary")
//   - Simulates live GPS trail in Faridabad (28.4089° N, 77.3178° E)
//   - Synchronizes identical values to OLED Screen & USB Serial Monitor
//   - Blinks on-board blue LED with each live telemetry packet
// ============================================================

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define ONBOARD_LED LED_BUILTIN // NodeMCU On-board Blue LED (GPIO 2 / D4)

bool oledOK = false;

// Simulated Vitals & State
int currentHR = 76;
int currentSpO2 = 98;
int battery = 96;
String motion = "Walking";

// Faridabad Simulated Coordinates
float currentLat = 28.40890;
float currentLon = 77.31780;

// Simulation Step Counters
int stepCounter = 0;
int motionCycle = 0;
bool heartBeatIcon = false;
bool ledState = false;

// Timers
unsigned long lastSend = 0;
unsigned long lastOLED = 0;

void setup() {
  // 1. Initialize On-board Blue LED
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(ONBOARD_LED, LOW); // Turn LED ON at boot

  // 2. Initialize Hardware Serial at 115200 baud
  Serial.begin(115200);
  delay(300);

  Serial.println();
  Serial.println("=================================================");
  Serial.println("   TREKSAFE SIMULATED TELEMETRY NODE (ESP8266)   ");
  Serial.println("=================================================");
  Serial.println("📍 Base Location: Faridabad (28.40890, 77.31780)");
  Serial.println("⚡ Broadcasting live JSON telemetry at 115200 baud...");

  // 3. Initialize I2C Bus: SDA=D2 (GPIO 4), SCL=D1 (GPIO 5)
  Wire.begin(D2, D1);
  Wire.setClock(100000); // 100 kHz standard clock

  // 4. Probe & Initialize OLED Display
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
    display.print("Live Telemetry");
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
  unsigned long now = millis();

  // ==========================================================
  // UPDATE SIMULATION STATE (Every 1000ms)
  // ==========================================================
  if (now - lastSend >= 1000) {
    lastSend = now;
    stepCounter++;

    // 1. Simulate Smooth Heart Rate (Range: 72 - 86 BPM)
    currentHR += random(-2, 3);
    currentHR = constrain(currentHR, 72, 86);

    // 2. Simulate SpO2 (Range: 96% - 99%)
    currentSpO2 += random(-1, 2);
    currentSpO2 = constrain(currentSpO2, 96, 99);

    // 3. Simulate Motion Cycle (10s Walking, 5s Stationary)
    motionCycle = (motionCycle + 1) % 15;
    if (motionCycle < 10) {
      motion = "Walking";
      // Slight walking GPS drift around Faridabad
      currentLat += (random(-3, 6) * 0.00001);
      currentLon += (random(-2, 5) * 0.00001);
    } else {
      motion = "Stationary";
    }

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
    Serial.print(",\"gps\":1");
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

    // Row 0: Top Header & Animated Beat
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("TREKSAFE");
    display.setCursor(68, 0);
    display.print("GPS:LOCK");
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
    display.print("MOT:");
    display.print(motion.substring(0, 4));
    display.print(" ");
    display.print(String(currentLat, 3));
    display.print(",");
    display.print(String(currentLon, 3));

    display.display();
  }

  yield(); // Keep ESP8266 background tasks responsive
}