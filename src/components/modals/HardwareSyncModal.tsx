'use client';

import React, { useState } from 'react';
import { useTrekSafe } from '@/context/TrekSafeContext';
import { X, Usb, Wifi, Play, Code, Check, Copy } from 'lucide-react';

interface HardwareSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HardwareSyncModal({ isOpen, onClose }: HardwareSyncModalProps) {
  const { applyHardwarePayload, showToast, setHardwareConnected } = useTrekSafe();
  const [tab, setTab] = useState<'usb' | 'wifi' | 'test' | 'code'>('usb');
  const [copied, setCopied] = useState(false);
  const [wifiIp, setWifiIp] = useState('http://192.168.4.1/telemetry');
  
  const [testHr, setTestHr] = useState(84);
  const [testSpo2, setTestSpo2] = useState(97);
  const [testMot, setTestMot] = useState('Walking');

  if (!isOpen) return null;

  const connectWebSerial = async () => {
    if (!('serial' in navigator)) {
      showToast('⚠️ Web Serial API requires Google Chrome or Microsoft Edge');
      return;
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      showToast('✅ Hardware Connected! Streaming live sensor values (115200 baud)...');
      setHardwareConnected(true);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const clean = line.trim();
            if (clean.startsWith('{') && clean.endsWith('}')) {
              try {
                const payload = JSON.parse(clean);
                applyHardwarePayload(payload);
              } catch (e) {}
            }
          }
        }
      }
    } catch (err: any) {
      showToast(`⚠️ USB connection notice: ${err.message}`);
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
    showToast(`⚡ Test payload synced: ${testHr} BPM · ${testSpo2}% SpO₂ · ${testMot}`);
    onClose();
  };

  const ARDUINO_CODE = `// TrekSafe IoT Prototype Firmware (ESP8266 / ESP32 + MAX30102 + MPU6050)
#include <Wire.h>
#include <ArduinoJson.h>

void setup() {
  Serial.begin(115200);
  Wire.begin();
}

void loop() {
  int hr = random(72, 95);
  int spo2 = random(95, 99);
  String mot = "Walking";
  int fall = 0;

  StaticJsonDocument<200> doc;
  doc["hr"] = hr;
  doc["spo2"] = spo2;
  doc["mot"] = mot;
  doc["fall"] = fall;
  doc["lat"] = 33.0185;
  doc["lon"] = 74.9490;
  doc["batt"] = 92;

  serializeJson(doc, Serial);
  Serial.println();
  delay(2000);
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(ARDUINO_CODE);
    setCopied(true);
    showToast('📋 Arduino C++ code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Usb className="w-5 h-5 text-cyan-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white font-serif">Physical Hardware Prototype Sync</h3>
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
            onClick={() => setTab('wifi')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              tab === 'wifi' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" /> Wi-Fi / IP Sync
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
            <Code className="w-3.5 h-3.5" /> Arduino Code
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
          
          {tab === 'usb' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 space-y-1">
                <div className="font-bold text-cyan-600 dark:text-cyan-300">Direct USB Serial Bridge (115200 Baud)</div>
                <p className="text-[11px] leading-relaxed">Connect your physical Arduino / ESP8266 / ESP32 device via USB. TrekSafe will read real-time JSON packets directly from the hardware sensors without installing any drivers.</p>
              </div>

              <button
                onClick={connectWebSerial}
                className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Usb className="w-4 h-4" /> Connect Physical Device Port
              </button>
            </div>
          )}

          {tab === 'wifi' && (
            <div className="space-y-3">
              <label className="block font-semibold">ESP8266 / ESP32 Access Point / LAN Endpoint:</label>
              <input
                type="text"
                value={wifiIp}
                onChange={(e) => setWifiIp(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => {
                  fetch(wifiIp)
                    .then(r => r.json())
                    .then(data => { applyHardwarePayload(data); showToast('✅ Wi-Fi prototype synced!'); onClose(); })
                    .catch(() => showToast('⚠️ Unable to reach IP. Please verify ESP8266 is on same network.'));
                }}
                className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs"
              >
                Sync Over Wi-Fi
              </button>
            </div>
          )}

          {tab === 'test' && (
            <div className="space-y-3">
              <p className="text-[11px]">Inject live test telemetry directly into the <strong className="text-cyan-400">You (This Device)</strong> trekker card:</p>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    value={testHr}
                    onChange={(e) => setTestHr(parseInt(e.target.value))}
                    className="w-full p-2 rounded border border-slate-700 bg-slate-800 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">SpO₂ (%)</label>
                  <input
                    type="number"
                    value={testSpo2}
                    onChange={(e) => setTestSpo2(parseInt(e.target.value))}
                    className="w-full p-2 rounded border border-slate-700 bg-slate-800 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">IMU Motion</label>
                  <select
                    value={testMot}
                    onChange={(e) => setTestMot(e.target.value)}
                    className="w-full p-2 rounded border border-slate-700 bg-slate-800 text-xs"
                  >
                    <option value="Walking">Walking</option>
                    <option value="Climbing">Climbing</option>
                    <option value="Resting">Resting</option>
                    <option value="⚠️ FALL DETECTED">⚠️ FALL DETECTED</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleTestInject}
                className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-md mt-2"
              >
                ⚡ Inject Prototype Values
              </button>
            </div>
          )}

          {tab === 'code' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400">Arduino C++ Firmware Sketch</span>
                <button onClick={copyCode} className="flex items-center gap-1 text-[10px] text-cyan-400 hover:underline">
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy Code'}
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 text-cyan-300 font-mono text-[10px] max-h-48 overflow-y-auto leading-relaxed border border-slate-800">
                {ARDUINO_CODE}
              </pre>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
