'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, Radio, BatteryCharging, Shield, Activity, Wifi, Terminal, ArrowRight } from 'lucide-react';

export default function TechnologyPage() {
  const specs = [
    {
      category: 'Biometric Sensors',
      items: [
        { name: 'MAX30102 Optical PPG', detail: 'Dual-wavelength red & infrared LEDs for reflective blood oxygen (SpO₂) and heart rate pulse monitoring with ambient light cancellation.' },
        { name: 'MPU6050 6-Axis IMU', detail: '3-axis MEMS gyroscope and 3-axis accelerometer configured for freefall impact detection and posture state recognition.' },
        { name: 'Skin Temperature Sensor', detail: 'High-precision NTC thermistor measuring peripheral hypothermia risk down to -20°C.' }
      ]
    },
    {
      category: 'RF Telemetry & Networking',
      items: [
        { name: 'SX1262 LoRa 915MHz', detail: 'Ultra-low-power spread-spectrum transceiver with +22 dBm output power achieving 15+ km line-of-sight range.' },
        { name: 'Mesh Relay Protocol', detail: 'Self-healing ad-hoc packet routing algorithm forwarding packets across mountain ridge repeaters.' },
        { name: 'AES-128 Encryption', detail: 'Hardware-accelerated cryptographic payload protection ensuring pilgrim medical confidentiality.' }
      ]
    },
    {
      category: 'Compute & Power Architecture',
      items: [
        { name: 'ESP8266 / ESP32 MCU', detail: 'Low-power 32-bit Tensilica core operating in deep-sleep cycles between transmission bursts.' },
        { name: '450mAh LiPo Battery', detail: '48+ hours continuous active telemetry on a single magnetic rapid charge (100% full in 35 mins).' },
        { name: 'IP68 Rugged Enclosure', detail: 'Ultrasonically sealed medical-grade silicone casing resistant to snow, heavy rain, and 2m drops onto granite.' }
      ]
    }
  ];

  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
          <Terminal className="w-3.5 h-3.5" />
          HARDWARE &amp; SENSOR ARCHITECTURE
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-serif text-slate-900 dark:text-white tracking-tight">
          Ruggedized <em>Silicon</em> Built for Extreme Altitude.
        </h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Detailed technical specifications of the TrekSafe wearable band, LoRa mesh topology, and automated triage server algorithms.
        </p>
      </div>

      {/* Spec Categories */}
      <div className="space-y-8">
        {specs.map((cat, idx) => (
          <div key={idx} className="space-y-4">
            <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-500" />
              <span>{cat.category}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cat.items.map((item, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-md space-y-2 hover:border-cyan-500/40 transition-all"
                >
                  <div className="font-bold text-sm text-cyan-600 dark:text-cyan-400 font-mono">
                    {item.name}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Live Hardware Prototype Integration Banner */}
      <div className="p-6 rounded-2xl border border-cyan-500/40 bg-slate-950 text-white space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
          <Terminal className="w-4 h-4" /> Web Serial API &amp; Physical Prototype Live Streaming
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          TrekSafe supports direct physical hardware testing. You can plug in an ESP8266 or ESP32 prototype over USB and stream live sensor values directly into the Command Dashboard in real time at 115200 baud.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-md transition-all"
        >
          ⚡ Connect Hardware in Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
