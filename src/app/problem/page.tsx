'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, HeartCrack, Mountain, WifiOff, ArrowRight } from 'lucide-react';

export default function ProblemPage() {
  const problems = [
    {
      num: '01',
      title: 'Silent Hypoxia at High Altitude',
      desc: 'Blood oxygen (SpO₂) drops precipitously above 2,500 meters. Pilgrims feel mild fatigue while their vital organs suffer severe hypoxia, leading to sudden irreversible collapse.',
      tag: '82% of Fatalities',
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/30'
    },
    {
      num: '02',
      title: 'The 45–90 Minute Discovery Lag',
      desc: 'When a lone devotee or elderly pilgrim collapses on an unlit stretch between checkpoints, discovery relies on passersby finding them. By then, critical resuscitation windows have closed.',
      tag: 'Fatal Bottleneck',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/30'
    },
    {
      num: '03',
      title: 'Total Cellular Dead Zones',
      desc: 'Rugged Himalayan terrain causes deep RF shadow zones. Standard mobile phones display "No Service", rendering emergency 112 calls and family check-ins completely impossible.',
      tag: 'Zero Infrastructure',
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/30'
    },
    {
      num: '04',
      title: 'Undisclosed Pre-Existing Conditions',
      desc: 'Elderly pilgrims often conceal heart conditions, hypertension, or asthma out of devotion. Without proactive biometric monitoring, first responders have zero clinical context.',
      tag: 'Clinical Blindspot',
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/30'
    }
  ];

  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
          <AlertTriangle className="w-3.5 h-3.5" />
          THE HIMALAYAN MORTALITY CRISIS
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-serif text-slate-900 dark:text-white tracking-tight">
          400+ Preventable Deaths <em>Every Season</em>.
        </h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Over 60 million devotees trek Himalayan pilgrimage routes each year. Outdated manual rescue models cost hundreds of lives that automated biometric telemetry can save.
        </p>
      </div>

      {/* Numbers Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-3xl font-black font-serif text-rose-500">400+</div>
          <div className="text-xs text-slate-500 mt-1">Annual Deaths</div>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-3xl font-black font-serif text-amber-500">68%</div>
          <div className="text-xs text-slate-500 mt-1">Aged 55 or Above</div>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-3xl font-black font-serif text-cyan-500">45 min</div>
          <div className="text-xs text-slate-500 mt-1">Avg. Discovery Time</div>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-3xl font-black font-serif text-emerald-500">70%</div>
          <div className="text-xs text-slate-500 mt-1">Terrain with No 4G/5G</div>
        </div>
      </div>

      {/* Problems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {problems.map((p, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-extrabold text-slate-300 dark:text-slate-700">{p.num}</span>
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${p.color}`}>
                {p.tag}
              </span>
            </div>
            <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white">{p.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA Box */}
      <div className="p-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-base text-slate-900 dark:text-white font-serif">How TrekSafe Eliminates This Bottleneck</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Continuous optical PPG vitals and sub-30-second LoRa mesh automated dispatch.</p>
        </div>
        <Link
          href="/how-it-works"
          className="flex-shrink-0 flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-md transition-all"
        >
          View Solution Pipeline <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}
