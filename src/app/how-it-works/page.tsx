'use client';

import React from 'react';
import Link from 'next/link';
import { Watch, Radio, Cpu, Ambulance, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      step: '01',
      icon: <Watch className="w-6 h-6 text-cyan-400" />,
      title: 'Pilgrim Biometric Wristband',
      desc: 'Devotees receive an IP68 ruggedized silicone wristband at the base camp checkpoint. Dual optical PPG sensors measure real-time Heart Rate and Blood Oxygen (SpO₂), while a 6-axis IMU detects motion states and sudden falls.',
      specs: ['MAX30102 Optical PPG', 'MPU6050 6-Axis Accelerometer', '48-hour LiPo Battery']
    },
    {
      step: '02',
      icon: <Radio className="w-6 h-6 text-emerald-400" />,
      title: 'Long-Range LoRa Mesh Telemetry',
      desc: 'Every 2 seconds, compact 12-byte telemetry packets are transmitted over 915 MHz LoRa radio up to 15 kilometers line-of-sight. Relay outposts hop packets across mountain peaks with zero reliance on cellular towers or internet.',
      specs: ['SX1262 LoRa 915MHz Transceiver', 'AES-128 Encrypted Packets', 'Solar-backed Relay Outposts']
    },
    {
      step: '03',
      icon: <Cpu className="w-6 h-6 text-amber-400" />,
      title: 'Automated Clinical Triage Engine',
      desc: 'Base command servers continuously evaluate vital trends. If SpO₂ drops below 90% (severe hypoxia), HR exceeds 130 BPM with cessation of movement, or a freefall impact is registered, an automated emergency protocol triggers.',
      specs: ['Rule-based Medical Triage', '30-Second False Alarm Grace', 'Automated Health Center Routing']
    },
    {
      step: '04',
      icon: <Ambulance className="w-6 h-6 text-rose-400" />,
      title: 'Rapid Outpost Rescue Dispatch',
      desc: 'The nearest Health Center (HC-1, HC-2, or HC-3) receives precise GPS coordinates and medical history. First responders dispatch with portable oxygen concentrators and stretchers, arriving in under 3 minutes.',
      specs: ['Sub-30s Total Reaction Time', 'Nearest Outpost Auto-Selection', 'Live Responder GPS Tracking']
    }
  ];

  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
          <Cpu className="w-3.5 h-3.5" />
          CONNECTED RESCUE PIPELINE
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-serif text-slate-900 dark:text-white tracking-tight">
          From <em>Biometric Ping</em> to <strong>Medic Dispatch</strong> in 30 Seconds.
        </h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          How our end-to-end hardware, mesh networking, and automated clinical triage pipeline operate under extreme mountain conditions.
        </p>
      </div>

      {/* Steps Timeline */}
      <div className="space-y-6">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-lg grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
          >
            <div className="md:col-span-2 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-3xl font-black font-serif text-cyan-500">{s.step}</span>
              <span className="text-[10px] font-mono uppercase text-slate-400 mt-1">Stage</span>
              <div className="mt-2">{s.icon}</div>
            </div>

            <div className="md:col-span-6 space-y-2">
              <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white">{s.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
            </div>

            <div className="md:col-span-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="text-[10px] font-bold uppercase text-slate-400">Technical Highlights</div>
              {s.specs.map((spec, i) => (
                <div key={i} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                  <span>{spec}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="p-8 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-slate-900/40 to-emerald-500/10 text-center space-y-4">
        <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">Experience Live Telemetry in Action</h3>
        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          Test live physical prototype synchronization, trigger simulated fall events, and inspect the clinical triage queue on our Command Dashboard.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-lg transition-all"
        >
          Open Command Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
