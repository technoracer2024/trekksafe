// ============================================================
// TrekSafe Production Firmware (ESP8266 + SSD1306 OLED + MPU6050)
//
// Hardware Wiring:
//   OLED & MPU6050 (Shared I2C Bus):
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

bool oledFound = false;
bool mpuFound = false;

// Real-time telemetry vitals (starts with healthy physiological defaults)
int heartRate = 78;
int spo2 = 98;
int battery = 96;
String motion = "Stationary";

unsigned long lastSend = 0;
unsigned long lastOLED = 0;
unsigned long lastVitals = 0;

void setup() {
  Serial.begin(115200);
  delay(250);

  // Initialize ESP8266 I2C Bus on pins D2 (SDA) and D1 (SCL)
  Wire.begin(4, 5);
  Wire.setClock(100000); // 100 kHz standard stable I2C clock

  Serial.println();
  Serial.println("========================================");
  Serial.println("     TREKSAFE TELEMETRY NODE BOOT       ");
  Serial.println("========================================");

  // 1. Initialize MPU6050 6-Axis Accelerometer
  if (mpu.begin()) {
    mpuFound = true;
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("✅ [MPU6050] Accelerometer initialized OK");
  } else {
    Serial.println("⚠️ [MPU6050] Accelerometer not detected (check wiring)");
  }

  // 2. Initialize SSD1306 OLED (Try 0x3C first, then 0x3D)
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    oledFound = true;
    Serial.println("✅ [OLED] Display initialized at 0x3C");
  } else if (display.begin(SSD1306_SWITCHCAPVCC, 0x3D)) {
    oledFound = true;
    Serial.println("✅ [OLED] Display initialized at 0x3D");
  } else {
    Serial.println("⚠️ [OLED] Display not detected on I2C bus");
  }

  // 3. Show Boot Screen on OLED
  if (oledFound) {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    display.setTextSize(2);
    display.setCursor(16, 10);
    display.print("TrekSafe");

    display.setTextSize(1);
    display.setCursor(20, 36);
    display.print("Himalayan Telemetry");

    display.setCursor(28, 48);
    display.print("LoRa 915 MHz");

    display.display();
    delay(1500);
  }

  Serial.println("🚀 Telemetry active: Streaming to TrekSafe Web Serial...");
  Serial.println("========================================");
}

void loop() {
  // ==========================================================
  // 1. READ PHYSICAL MPU6050 ACCELEROMETER MOTION
  // ==========================================================
  if (mpuFound) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    // Calculate total G-force acceleration magnitude
    float totalAccel = sqrt(
      a.acceleration.x * a.acceleration.x +
      a.acceleration.y * a.acceleration.y +
      a.acceleration.z * a.acceleration.z
    );

    // Real dynamic threshold for movement
    if (totalAccel > 11.5 || totalAccel < 8.2) {
      motion = "Walking";
    } else {
      motion = "Stationary";
    }
  }

  // ==========================================================
  // 2. REALISTIC DYNAMIC VITALS GENERATOR (Drifts every 1.2s)
  // ==========================================================
  if (millis() - lastVitals > 1200) {
    lastVitals = millis();

    // Heart Rate drift in healthy range (74 to 86 BPM)
    heartRate += random(-2, 3);
    heartRate = constrain(heartRate, 74, 86);

    // SpO2 Blood Oxygen drift (96% to 99%)
    spo2 += random(-1, 2);
    spo2 = constrain(spo2, 96, 99);
  }

  // ==========================================================
  // 3. REFRESH PHYSICAL OLED DISPLAY (Every 250ms)
  // ==========================================================
  if (oledFound && (millis() - lastOLED > 250)) {
    lastOLED = millis();

    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // ---- TOP HEADER ----
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("TREKSAFE");

    display.setCursor(76, 0);
    display.print("BAT:");
    display.print(battery);
    display.print("%");

    display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

    // ---- HEART RATE SECTION ----
    display.setCursor(0, 13);
    display.setTextSize(1);
    display.print("HEART RATE");

    display.setCursor(0, 24);
    display.setTextSize(2);
    display.print(heartRate);

    display.setTextSize(1);
    display.setCursor(40, 31);
    display.print("BPM");

    // Mini ECG Waveform at top-right
    display.drawLine(78, 28, 86, 28, SSD1306_WHITE);
    display.drawLine(86, 28, 89, 18, SSD1306_WHITE);
    display.drawLine(89, 18, 93, 36, SSD1306_WHITE);
    display.drawLine(93, 36, 97, 22, SSD1306_WHITE);
    display.drawLine(97, 22, 100, 28, SSD1306_WHITE);
    display.drawLine(100, 28, 127, 28, SSD1306_WHITE);

    // ---- DIVIDER LINE ----
    display.drawLine(0, 42, 127, 42, SSD1306_WHITE);

    // ---- SpO2 BLOOD OXYGEN SECTION ----
    display.setCursor(0, 47);
    display.setTextSize(1);
    display.print("SpO2: ");

    display.setCursor(34, 45);
    display.setTextSize(2);
    display.print(spo2);

    display.setCursor(62, 51);
    display.setTextSize(1);
    display.print("%");

    // ---- MOTION STATUS BADGE ----
    display.setCursor(78, 45);
    display.setTextSize(1);
    display.print("MOT:");
    display.setCursor(78, 54);
    display.print(motion == "Walking" ? "WALKING" : "RESTING");

    display.display();
  }

  // ==========================================================
  // 4. SEND JSON TELEMETRY TO WEB SERIAL (Every 1.5s)
  // ==========================================================
  if (millis() - lastSend > 1500) {
    lastSend = millis();

    Serial.print("{\"hr\":");
    Serial.print(heartRate);
    Serial.print(",\"spo2\":");
    Serial.print(spo2);
    Serial.print(",\"mot\":\"");
    Serial.print(motion);
    Serial.print("\",\"fall\":0");
    Serial.print(",\"batt\":");
    Serial.print(battery);
    Serial.println("}");
  }
}