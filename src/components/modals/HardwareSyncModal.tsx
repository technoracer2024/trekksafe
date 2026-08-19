'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTrekSafe } from '@/context/TrekSafeContext';
import { X, Usb, Wifi, Play, Code, Check, Copy, Terminal, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface HardwareSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HardwareSyncModal({ isOpen, onClose }: HardwareSyncModalProps) {
  const { applyHardwarePayload, showToast, setHardwareConnected, hardwareConnected } = useTrekSafe();
  const [tab, setTab] = useState<'usb' | 'wifi' | 'test' | 'code'>('usb');
  const [copied, setCopied] = useState(false);
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [isReading, setIsReading] = useState(false);
  const [serialLogs, setSerialLogs] = useState<string[]>([]);
  const [lastParsed, setLastParsed] = useState<any>(null);
  const [rawBufferCount, setRawBufferCount] = useState<number>(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const [testHr, setTestHr] = useState(84);
  const [testSpo2, setTestSpo2] = useState(97);
  const [testMot, setTestMot] = useState('Walking');

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs]);

  if (!isOpen) return null;

  // Universal Smart Serial Parser (Supports JSON, Key-Value, CSV, Sparkfun MAX30102)
  const parseSerialLine = (line: string): any | null => {
    const clean = line.trim();
    if (!clean) return null;

    // 1. Strict or embedded JSON {...}
    const jsonMatch = clean.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.hr !== undefined || parsed.spo2 !== undefined || parsed.heartRate !== undefined) {
          return {
            hr: parsed.hr ?? parsed.heartRate ?? parsed.bpm,
            spo2: parsed.spo2 ?? parsed.oxygen ?? parsed.o2,
            mot: parsed.mot ?? parsed.movement ?? parsed.motion ?? 'Active',
            fall: parsed.fall === 1 || parsed.fall === true || parsed.mot === 'Fallen' ? 1 : 0,
            lat: parsed.lat ? parseFloat(parsed.lat) : undefined,
            lon: parsed.lon ? parseFloat(parsed.lon) : undefined,
            gps: parsed.gps !== undefined ? parseInt(parsed.gps) : (parsed.lat ? 1 : 0),
            batt: parsed.batt ? parseInt(parsed.batt) : undefined
          };
        }
      } catch (e) {}
    }

    // 2. Key-Value pairs (e.g., "HR: 84, SpO2: 97, LAT: 33.0185, LON: 74.9490" or "BPM=84 O2=98")
    let hr: number | undefined;
    let spo2: number | undefined;
    let fall: number | undefined;
    let mot: string | undefined;
    let lat: number | undefined;
    let lon: number | undefined;

    const hrMatch = clean.match(/(?:hr|bpm|heart[\s_]*rate|pulse)[\s:=]+(\d+)/i);
    if (hrMatch) hr = parseInt(hrMatch[1]);

    const spo2Match = clean.match(/(?:spo2|o2|oxygen|ox)[\s:=]+(\d+)/i);
    if (spo2Match) spo2 = parseInt(spo2Match[1]);

    const fallMatch = clean.match(/(?:fall|impact)[\s:=]+(\d+|true|false)/i);
    if (fallMatch) fall = fallMatch[1] === '1' || fallMatch[1].toLowerCase() === 'true' ? 1 : 0;

    const motMatch = clean.match(/(?:mot|movement|motion|activity)[\s:=]+["']?([a-zA-Z\s]+)["']?/i);
    if (motMatch) mot = motMatch[1].trim();

    const latMatch = clean.match(/(?:lat|latitude)[\s:=]+([-\d.]+)/i);
    if (latMatch) lat = parseFloat(latMatch[1]);

    const lonMatch = clean.match(/(?:lon|lng|longitude)[\s:=]+([-\d.]+)/i);
    if (lonMatch) lon = parseFloat(lonMatch[1]);

    if (hr !== undefined || spo2 !== undefined || lat !== undefined) {
      return {
        hr: hr ?? 75,
        spo2: spo2 ?? 98,
        mot: mot ?? (fall ? '⚠️ FALL DETECTED' : 'Walking'),
        fall: fall ?? 0,
        lat,
        lon
      };
    }

    // 3. Comma-separated numbers (e.g., "84, 97" or "84, 97, 0")
    const nums = clean.split(/[,\t| ]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    if (nums.length >= 2) {
      if (nums[0] >= 35 && nums[0] <= 230 && nums[1] >= 50 && nums[1] <= 100) {
        return {
          hr: Math.round(nums[0]),
          spo2: Math.round(nums[1]),
          mot: nums[2] === 1 ? '⚠️ FALL DETECTED' : 'Walking',
          fall: nums[2] === 1 ? 1 : 0
        };
      }
    }

    return null;
  };

  const connectWebSerial = async () => {
    if (!('serial' in navigator)) {
      showToast('⚠️ Web Serial API requires Google Chrome or Microsoft Edge');
      return;
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate });
      showToast(`✅ Serial Port Connected @ ${baudRate} baud!`);
      setHardwareConnected(true);
      setIsReading(true);

      const decoder = new TextDecoder('utf-8', { fatal: false });
      let buffer = '';

      while (port.readable) {
        let reader;
        try {
          reader = port.readable.getReader();
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              setRawBufferCount(prev => prev + chunk.length);

              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line) continue;

                // Add to terminal display
                setSerialLogs(prev => [...prev.slice(-40), line]);

                // Attempt smart parsing
                const parsed = parseSerialLine(line);
                if (parsed) {
                  setLastParsed(parsed);
                  applyHardwarePayload(parsed);
                }
              }
            }
          }
        } catch (streamErr: any) {
          console.warn('Recovering Web Serial stream:', streamErr);
        } finally {
          if (reader) {
            try { reader.releaseLock(); } catch (_) {}
          }
        }
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (err: any) {
      setIsReading(false);
      showToast(`⚠️ Serial notice: ${err.message}`);
    }
  };

  const handleTestInject = () => {
    applyHardwarePayload({
      hr: testHr,
      spo2: testSpo2,
      mot: testMot,
      fall: testMot.includes('FALL') ? 1 : 0,
      lat: 33.0185,
      lon: 74.9490,
      batt: 94
    });
    setLastParsed({ hr: testHr, spo2: testSpo2, mot: testMot, fall: testMot.includes('FALL') ? 1 : 0 });
    showToast(`⚡ Test payload applied: ${testHr} BPM · ${testSpo2}% SpO₂`);
    onClose();
  };

  const ARDUINO_CODE = `// ============================================================
// TrekSafe Telemetry Node - Mission System
// ESP8266 + SSD1306 OLED + MPU6050 IMU + GPS + 3-Pin Buzzer
//
// Hardware Wiring:
//   OLED Display:    SDA -> D2 (GPIO 4), SCL -> D1 (GPIO 5), VCC -> 3V3, GND -> GND
//   MPU6050 IMU:     SDA -> D2 (GPIO 4), SCL -> D1 (GPIO 5), VCC -> 3V3, GND -> GND
//   GPS Module:      TX -> D5 (GPIO 14 - ESP RX), RX -> D6 (GPIO 12 - ESP TX), VCC -> Vin (5V), GND -> GND
//   3-Pin Buzzer:    S (Signal) -> D0 (GPIO 16), + (VCC) -> 3V3, - (GND) -> GND
//   On-board LED:    D4 (GPIO 2 - Blinks on live telemetry transmission)
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
#define BUZZER_PIN D0           // 3-Pin Buzzer Signal Pin (GPIO 16)

bool oledOK = false;
bool mpuOK = false;
bool gpsFix = false;
unsigned long lastGpsSentenceTime = 0;

// Fall Detection & Buzzer Alarm State
bool isFall = false;
unsigned long fallStartTime = 0;
const unsigned long ALARM_DURATION_MS = 15000; // Buzzer sounds for 15 seconds upon fall impact

// Vitals & State
int currentHR = 76;
int currentSpO2 = 98;
int battery = 96;
String motion = "Walking";

// Dynamic GPS Coordinates (0.0 when searching/indoors, Wi-Fi positioning is authoritative)
float currentLat = 0.0;
float currentLon = 0.0;

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
  output[0] = '\\0';

  for (int i = 0; sentence[i] != '\\0' && sentence[i] != '*' && sentence[i] != '\\r' && sentence[i] != '\\n'; i++) {
    if (sentence[i] == ',') {
      currentField++;
      if (currentField > targetIndex) break;
    } else if (currentField == targetIndex) {
      if (outPos < maxLen - 1) {
        output[outPos++] = sentence[i];
      }
    }
  }
  output[outPos] = '\\0';
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
      if (c == '\\n' || c == '\\r') {
        buf[pos] = '\\0';

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

  // If no GPS satellite sentence for > 6 seconds, revert to Wi-Fi mode
  if (gpsFix && (millis() - lastGpsSentenceTime > 6000)) {
    gpsFix = false;
    currentLat = 0.0;
    currentLon = 0.0;
  }
}

void setup() {
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(ONBOARD_LED, LOW);

  // Setup Buzzer Pin (PWM Passive / 3-Pin Active)
  pinMode(BUZZER_PIN, OUTPUT);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);

  Serial.begin(115200);
  delay(300);

  Serial.println();
  Serial.println("=================================================");
  Serial.println("   TREKSAFE TELEMETRY NODE (FALL ALARM READY)    ");
  Serial.println("=================================================");
  Serial.println("🛰️ GPS Module listening on D5 (RX) / D6 (TX) @ 9600 baud");
  Serial.println("📶 Wi-Fi Positioning managed dynamically by Web App");
  Serial.println("🔊 3-Pin Buzzer Signal on Pin D0 (GPIO 16)");
  Serial.println("⚡ Broadcasting live JSON telemetry at 115200 baud...");

  pinMode(D5, INPUT_PULLUP);
  gpsSerial.begin(9600);

  // Safe I2C Initialization with Clock Stretch Limit (Prevents hanging)
  Wire.begin(D2, D1);
  Wire.setClock(100000);
  #if defined(ESP8266)
  Wire.setClockStretchLimit(2000); // 2ms timeout prevents hanging if no I2C device
  #endif
  delay(50);

  // Probe OLED Display
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    oledOK = true;
    display.clearDisplay();
    display.dim(false);
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(2);
    display.setCursor(15, 8);
    display.print("TrekSafe");
    display.setTextSize(1);
    display.setCursor(12, 34);
    display.print("NodeMCU Mission");
    display.setCursor(12, 48);
    display.print("Live Telemetry");
    display.display();
    Serial.println("✅ [OLED] SSD1306 Display connected @ 0x3C");
  } else if (display.begin(SSD1306_SWITCHCAPVCC, 0x3D)) {
    oledOK = true;
    display.clearDisplay();
    display.dim(false);
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(2);
    display.setCursor(15, 8);
    display.print("TrekSafe");
    display.display();
    Serial.println("✅ [OLED] SSD1306 Display connected @ 0x3D");
  } else {
    oledOK = false;
    Serial.println("ℹ️ [OLED] Display not detected on D2(SDA)/D1(SCL) - continuing stream");
  }

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
  // UPDATE VITALS (Every 1000ms)
  // ==========================================================
  if (now - lastSend >= 1000) {
    lastSend = now;

    // Smooth Heart Rate
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

    // BROADCAST EXACT JSON TO USB SERIAL
    Serial.print("{\\"hr\\":");
    Serial.print(currentHR);
    Serial.print(",\\"spo2\\":");
    Serial.print(currentSpO2);
    Serial.print(",\\"mot\\":\\"");
    Serial.print(motion);
    Serial.print("\\"");
    if (gpsFix && currentLat != 0.0 && currentLon != 0.0) {
      Serial.print(",\\"lat\\":");
      Serial.print(String(currentLat, 5));
      Serial.print(",\\"lon\\":");
      Serial.print(String(currentLon, 5));
      Serial.print(",\\"gps\\":1");
    } else {
      Serial.print(",\\"gps\\":0");
    }
    Serial.print(",\\"fall\\":");
    Serial.print(isFall ? 1 : 0);
    Serial.print(",\\"batt\\":");
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
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(ARDUINO_CODE);
    setCopied(true);
    showToast('📋 Arduino C++ code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Usb className="w-5 h-5 text-cyan-500 animate-pulse" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white font-serif">
              Physical Hardware Prototype Bridge
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold">
          <button
            onClick={() => setTab('usb')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              tab === 'usb' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Usb className="w-3.5 h-3.5" /> Web Serial (USB)
          </button>
          <button
            onClick={() => setTab('test')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              tab === 'test' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Sensor Test Injector
          </button>
          <button
            onClick={() => setTab('code')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              tab === 'code' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Code className="w-3.5 h-3.5" /> Arduino Firmware Code
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          
          {tab === 'usb' && (
            <div className="space-y-4">
              
              {/* Baud Rate & Connect Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Baud Rate:</span>
                  <select
                    value={baudRate}
                    onChange={(e) => setBaudRate(parseInt(e.target.value))}
                    disabled={isReading}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value={115200}>115200 (Recommended)</option>
                    <option value={9600}>9600 (Standard Arduino)</option>
                    <option value={57600}>57600</option>
                    <option value={38400}>38400</option>
                    <option value={19200}>19200</option>
                  </select>
                </div>

                <button
                  onClick={connectWebSerial}
                  className={`py-2 px-4 rounded-lg font-bold shadow-md transition-all flex items-center gap-2 ${
                    isReading
                      ? 'bg-emerald-500 text-white'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-white'
                  }`}
                >
                  <Usb className="w-4 h-4" />
                  {isReading ? '🟢 Streaming Live Data...' : 'Connect Serial Port (USB)'}
                </button>
              </div>

              {/* Status Indicator */}
              {lastParsed && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Active Telemetry Received:</span>
                  </div>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    ❤️ {lastParsed.hr} BPM · 🫁 {lastParsed.spo2}% SpO₂ · 🏃 {lastParsed.mot}
                  </div>
                </div>
              )}

              {/* Live Serial Terminal Monitor */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-cyan-400" /> Live Serial Monitor</span>
                  <span>{serialLogs.length} lines logged ({rawBufferCount} bytes)</span>
                </div>
                
                <div className="w-full h-44 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-y-auto space-y-1 shadow-inner">
                  {serialLogs.length === 0 ? (
                    <div className="text-slate-500 text-center pt-14">
                      {isReading ? '⏳ Listening on COM port... Waiting for sensor packets...' : 'Plug in USB and click "Connect Serial Port" above to view incoming data.'}
                    </div>
                  ) : (
                    serialLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-slate-600 select-none">[{idx + 1}]</span>
                        <span className="text-slate-200 break-all">{log}</span>
                      </div>
                    ))
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed">
                💡 <strong>Supported Formats:</strong> JSON (<code>{`{"hr":84,"spo2":97}`}</code>), Key-Value (<code>HR: 84, SpO2: 97</code>), or CSV numbers (<code>84, 97</code>).
              </div>

            </div>
          )}

          {tab === 'test' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-slate-700 dark:text-slate-300">
                Manually simulate real-time sensor metrics to test the dashboard gauges, ECG, and emergency dispatch.
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Heart Rate (BPM):</span>
                    <span className="text-cyan-500 font-mono font-bold text-sm">{testHr} BPM</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="160"
                    value={testHr}
                    onChange={(e) => setTestHr(parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Blood Oxygen (SpO₂ %):</span>
                    <span className="text-emerald-500 font-mono font-bold text-sm">{testSpo2}%</span>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="100"
                    value={testSpo2}
                    onChange={(e) => setTestSpo2(parseInt(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Movement State:</label>
                  <select
                    value={testMot}
                    onChange={(e) => setTestMot(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Stationary">Stationary (Resting)</option>
                    <option value="Walking">Walking</option>
                    <option value="Climbing">Climbing (Steep Ascent)</option>
                    <option value="⚠️ FALL DETECTED">⚠️ FALL DETECTED (Trigger Emergency)</option>
                  </select>
                </div>

                <button
                  onClick={handleTestInject}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Apply Live Sensor Values
                </button>
              </div>
            </div>
          )}

          {tab === 'code' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Ready-to-Flash Arduino / ESP C++ Sketch:</span>
                <button
                  onClick={copyCode}
                  className="py-1 px-3 rounded-md bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Sketch'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-64 shadow-inner">
                {ARDUINO_CODE}
              </pre>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
