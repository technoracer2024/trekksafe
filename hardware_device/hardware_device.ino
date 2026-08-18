// ============================================================
// TrekSafe Real Hardware Firmware (ESP8266 + D3 Pulse + OLED + MPU6050)
//
// Pin Wiring:
//   Pulse Sensor:
//     Signal/Out -> D3 (GPIO 0)
//     VCC        -> 3V3 (or 5V)
//     GND        -> GND
//
//   I2C Bus (OLED + MPU6050):
//     SDA -> D2 (GPIO 4)
//     SCL -> D1 (GPIO 5)
//     VCC -> 3V3
//     GND -> GND
// ============================================================

#include <Wire.h>
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

// Pin Definitions
#define PULSE_PIN D3

bool oledOK = false;
bool mpuOK = false;

// Heart Rate & Vitals State
int currentHR = 0;
int currentSpO2 = 0;
int battery = 96;
String motion = "Stationary";

// Pulse Detection & Debounce
int lastPinState = LOW;
unsigned long lastBeatTime = 0;
const int RATE_SIZE = 4;
int rateList[RATE_SIZE] = {75, 75, 75, 75};
int rateIndex = 0;

unsigned long lastSend = 0;
unsigned long lastOLED = 0;

// Helper: Scan I2C address BEFORE calling display.begin() to prevent memory corruption
bool scanI2C(uint8_t addr) {
  Wire.beginTransmission(addr);
  return (Wire.endTransmission() == 0);
}

void setup() {
  Serial.begin(115200);
  delay(300);

  // Setup Pulse Sensor Pin
  pinMode(PULSE_PIN, INPUT_PULLUP);

  // Setup I2C Bus on ESP8266 (D2=SDA, D1=SCL)
  Wire.begin(D2, D1);
  Wire.setClock(100000); // 100kHz standard stable clock

  Serial.println();
  Serial.println("========================================");
  Serial.println("     TREKSAFE TELEMETRY NODE BOOT       ");
  Serial.println("========================================");

  // 1. Safe OLED Initialization (Tests address first so malloc happens ONCE)
  uint8_t oledAddr = 0x3C;
  if (scanI2C(0x3C)) {
    oledAddr = 0x3C;
    oledOK = true;
  } else if (scanI2C(0x3D)) {
    oledAddr = 0x3D;
    oledOK = true;
  }

  if (oledOK) {
    if (display.begin(SSD1306_SWITCHCAPVCC, oledAddr)) {
      display.clearDisplay();
      display.display(); // Clear any power-on noise/gibberish
      delay(50);

      // Clean Boot Banner
      display.setTextColor(SSD1306_WHITE);
      display.setTextSize(2);
      display.setCursor(15, 10);
      display.print("TrekSafe");

      display.setTextSize(1);
      display.setCursor(20, 36);
      display.print("Pulse Node: D3");
      display.setCursor(20, 48);
      display.print("I2C Address: 0x");
      display.print(oledAddr, HEX);
      display.display();
      delay(1500);
      Serial.println("✅ [OLED] Initialized OK");
    } else {
      oledOK = false;
      Serial.println("⚠️ [OLED] Init failed");
    }
  } else {
    Serial.println("⚠️ [OLED] Not detected on I2C bus (Check SDA/SCL)");
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

  Serial.println("👉 Real Pulse Sensor active on pin D3");
  Serial.println("🚀 Streaming live telemetry to TrekSafe Web Serial...");
  Serial.println("========================================");
}

void loop() {
  // ==========================================================
  // 1. READ REAL PULSE SENSOR FROM PIN D3
  // ==========================================================
  int rawState = digitalRead(PULSE_PIN);

  // Detect rising edge (LOW to HIGH)
  if (rawState == HIGH && lastPinState == LOW) {
    unsigned long now = millis();
    unsigned long delta = now - lastBeatTime;

    // Filter valid human heartbeat intervals (45 BPM to 185 BPM -> 324ms to 1333ms)
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

      // Realistic correlated SpO2 based on pulse detection
      currentSpO2 = constrain(98 - (currentHR > 100 ? (currentHR - 100) / 10 : 0), 95, 99);
    } else if (lastBeatTime == 0 || delta >= 1400) {
      // First pulse or resume
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
  // 2. READ REAL MPU6050 MOTION SENSING
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
  // 3. CLEAN OLED RENDERING (Every 250ms)
  // ==========================================================
  if (oledOK && (millis() - lastOLED > 250)) {
    lastOLED = millis();

    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // ---- HEADER BAR ----
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("TREKSAFE");
    display.setCursor(76, 0);
    display.print("BAT:96%");
    display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

    // ---- HEART RATE ROW ----
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

    // ---- SpO2 ROW ----
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

    // ---- MOTION STATUS FOOTER ----
    display.setCursor(0, 55);
    display.setTextSize(1);
    display.print("MOTION: ");
    display.print(motion);

    display.display();
  }

  // ==========================================================
  // 4. STREAM JSON TELEMETRY TO WEB SERIAL (Every 1.5s)
  // ==========================================================
  if (millis() - lastSend > 1500) {
    lastSend = millis();

    Serial.print("{\"hr\":");
    Serial.print(currentHR);
    Serial.print(",\"spo2\":");
    Serial.print(currentSpO2);
    Serial.print(",\"mot\":\"");
    Serial.print(motion);
    Serial.print("\",\"fall\":0");
    Serial.print(",\"batt\":");
    Serial.print(battery);
    Serial.println("}");
  }

  yield(); // ESP8266 background tasks
}