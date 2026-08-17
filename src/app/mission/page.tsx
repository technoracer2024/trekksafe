'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Target, Award, Users, Mountain, HeartHandshake, CheckCircle2, ArrowRight } from 'lucide-react';

export default function MissionPage() {
  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
          <Mountain className="w-3.5 h-3.5" />
          CORE PURPOSE &amp; PHILOSOPHY
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-serif text-slate-900 dark:text-white tracking-tight">
          Every Pilgrim <em>Comes Home</em>.
        </h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          We believe spiritual faith should never cost a human life. TrekSafe deploys zero-cellular telemetry networks across sacred Himalayan routes to safeguard millions of devotees.
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-lg space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg font-serif text-slate-900 dark:text-white">Zero Delayed Discoveries</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Eliminate the 45-minute discovery gap when pilgrims collapse on isolated mountain passes. Immediate biometric fall and hypoxia detection under 30 seconds.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-lg space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg font-serif text-slate-900 dark:text-white">Radical Accessibility</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            High-tech health protection shouldn&apos;t require expensive smartphones. Our reusable ₹50/day silicone wristbands protect pilgrims regardless of age or digital literacy.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-lg space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg font-serif text-slate-900 dark:text-white">Zero Cellular Dependence</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Himalayan weather routinely disables telecom towers. Our autonomous LoRa mesh operates continuously across rain, sub-zero snowstorms, and rockfalls.
          </p>
        </div>

      </div>

      {/* Deployment Vision */}
      <div className="p-8 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 via-slate-900/40 to-emerald-500/5 backdrop-blur-md space-y-6">
        <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-white">
          The 2026–2028 National Pilgrimage Corridor Roadmap
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-sm font-bold text-slate-900 dark:text-white block mb-1">Vaishno Devi Shrine Corridor (Katrs to Bhawan)</strong>
              <span className="text-slate-500 dark:text-slate-400">12.5 km live pilot tracking 10,000 daily pilgrims with 4 solar-powered LoRa mesh relays and 3 medical response posts.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60">
            <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-sm font-bold text-slate-900 dark:text-white block mb-1">Shri Amarnathji Yatra (Baltal &amp; Pahalgam Tracks)</strong>
              <span className="text-slate-500 dark:text-slate-400">High-altitude deployment up to 3,888m elevation targeting extreme hypoxia and cold-induced cardiac arrest.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60">
            <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-sm font-bold text-slate-900 dark:text-white block mb-1">Kedarnath Dham &amp; Char Dham Yatra</strong>
              <span className="text-slate-500 dark:text-slate-400">16 km steep trek monitoring elder pilgrims with automatic cardiac CAD strain alerts.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60">
            <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-sm font-bold text-slate-900 dark:text-white block mb-1">Hemkund Sahib &amp; Valley of Flowers</strong>
              <span className="text-slate-500 dark:text-slate-400">Sub-zero glacial tracking with integrated search perimeter radar for disoriented pilgrims.</span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-lg transition-all"
          >
            Launch Command Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}
