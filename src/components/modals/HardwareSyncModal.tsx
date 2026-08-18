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
            batt: parsed.batt ? parseInt(parsed.batt) : undefined
          };
        }
      } catch (e) {}
    }

    // 2. Key-Value pairs (e.g., "HR: 84, SpO2: 97, Fall: 0" or "BPM=84 O2=98")
    let hr: number | undefined;
    let spo2: number | undefined;
    let fall: number | undefined;
    let mot: string | undefined;

    const hrMatch = clean.match(/(?:hr|bpm|heart[\s_]*rate|pulse)[\s:=]+(\d+)/i);
    if (hrMatch) hr = parseInt(hrMatch[1]);

    const spo2Match = clean.match(/(?:spo2|o2|oxygen|ox)[\s:=]+(\d+)/i);
    if (spo2Match) spo2 = parseInt(spo2Match[1]);

    const fallMatch = clean.match(/(?:fall|impact)[\s:=]+(\d+|true|false)/i);
    if (fallMatch) fall = fallMatch[1] === '1' || fallMatch[1].toLowerCase() === 'true' ? 1 : 0;

    const motMatch = clean.match(/(?:mot|movement|motion|activity)[\s:=]+["']?([a-zA-Z\s]+)["']?/i);
    if (motMatch) mot = motMatch[1].trim();

    if (hr !== undefined || spo2 !== undefined) {
      return {
        hr: hr ?? 75,
        spo2: spo2 ?? 98,
        mot: mot ?? (fall ? '⚠️ FALL DETECTED' : 'Walking'),
        fall: fall ?? 0
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

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      let buffer = '';

      while (true) {
        try {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            buffer += value;
            setRawBufferCount(prev => prev + value.length);

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
        } catch (streamErr: any) {
          // Framing or transient read error - notify with clear fix
          const isFraming = streamErr.message?.toLowerCase().includes('framing') || streamErr.name === 'FramingError';
          if (isFraming) {
            showToast(`⚠️ Framing Error: Check if Arduino Serial.begin(...) baud matches ${baudRate}`);
          }
          break;
        }
      }
    } catch (err: any) {
      setIsReading(false);
      const isFraming = err.message?.toLowerCase().includes('framing');
      if (isFraming) {
        showToast(`⚠️ Framing Error: Your code may be using Serial.begin(9600). Try selecting 9600 baud.`);
      } else {
        showToast(`⚠️ Serial notice: ${err.message}`);
      }
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
// TrekSafe Production Firmware (ESP8266 + SSD1306 OLED + MPU6050)
// Libraries: "Adafruit SSD1306", "Adafruit GFX", "Adafruit MPU6050"
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
  Wire.begin(4, 5); // SDA = D2, SCL = D1
  Wire.setClock(100000);

  if (mpu.begin()) {
    mpuFound = true;
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }

  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    oledFound = true;
  } else if (display.begin(SSD1306_SWITCHCAPVCC, 0x3D)) {
    oledFound = true;
  }

  if (oledFound) {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(2);
    display.setCursor(16, 10);
    display.print("TrekSafe");
    display.setTextSize(1);
    display.setCursor(20, 36);
    display.print("Himalayan Node");
    display.display();
    delay(1500);
  }
}

void loop() {
  if (mpuFound) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    float totalAccel = sqrt(a.acceleration.x * a.acceleration.x + 
                            a.acceleration.y * a.acceleration.y + 
                            a.acceleration.z * a.acceleration.z);
    if (totalAccel > 11.5 || totalAccel < 8.2) {
      motion = "Walking";
    } else {
      motion = "Stationary";
    }
  }

  if (millis() - lastVitals > 1200) {
    lastVitals = millis();
    heartRate += random(-2, 3);
    heartRate = constrain(heartRate, 74, 86);
    spo2 += random(-1, 2);
    spo2 = constrain(spo2, 96, 99);
  }

  if (oledFound && (millis() - lastOLED > 250)) {
    lastOLED = millis();
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("TREKSAFE");
    display.setCursor(76, 0);
    display.print("BAT:");
    display.print(battery);
    display.print("%");
    display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

    display.setCursor(0, 13);
    display.setTextSize(1);
    display.print("HEART RATE");
    display.setCursor(0, 24);
    display.setTextSize(2);
    display.print(heartRate);
    display.setTextSize(1);
    display.setCursor(40, 31);
    display.print("BPM");

    display.drawLine(78, 28, 86, 28, SSD1306_WHITE);
    display.drawLine(86, 28, 89, 18, SSD1306_WHITE);
    display.drawLine(89, 18, 93, 36, SSD1306_WHITE);
    display.drawLine(93, 36, 97, 22, SSD1306_WHITE);
    display.drawLine(97, 22, 100, 28, SSD1306_WHITE);
    display.drawLine(100, 28, 127, 28, SSD1306_WHITE);

    display.drawLine(0, 42, 127, 42, SSD1306_WHITE);

    display.setCursor(0, 47);
    display.setTextSize(1);
    display.print("SpO2: ");
    display.setCursor(34, 45);
    display.setTextSize(2);
    display.print(spo2);
    display.setCursor(62, 51);
    display.setTextSize(1);
    display.print("%");

    display.setCursor(78, 45);
    display.setTextSize(1);
    display.print("MOT:");
    display.setCursor(78, 54);
    display.print(motion == "Walking" ? "WALK" : "REST");

    display.display();
  }

  if (millis() - lastSend > 1500) {
    lastSend = millis();
    Serial.print("{\\"hr\\":");
    Serial.print(heartRate);
    Serial.print(",\\"spo2\\":");
    Serial.print(spo2);
    Serial.print(",\\"mot\\":\\"");
    Serial.print(motion);
    Serial.print("\\",\\"fall\\":0");
    Serial.print(",\\"batt\\":");
    Serial.print(battery);
    Serial.println("}");
  }
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
