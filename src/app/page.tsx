'use client';

import React from 'react';
import CommandCenter from '@/components/dashboard/CommandCenter';
import HeroStatsStrip from '@/components/sections/HeroStatsStrip';
import HeroCanvas from '@/components/layout/HeroCanvas';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Cpu, Activity, Clock, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative space-y-12 pb-8">
      
      {/* Telemetry Constellation Canvas Background */}
      <HeroCanvas />

      {/* ── 1. MAIN CENTERPIECE DASHBOARD ── */}
      <section className="relative z-10">
        <CommandCenter />
      </section>

      {/* ── 2. REAL-TIME STATS STRIP ── */}
      <section className="relative z-10 pt-4">
        <HeroStatsStrip />
      </section>

      {/* ── 3. PLATFORM QUICK ACCESS TILES ── */}
      <section className="relative z-10 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <h2 className="text-2xl font-extrabold font-serif text-slate-900 dark:text-white">
            Architecture &amp; Mission Deep-Dives
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Explore how TrekSafe bridges IoT wearables, long-range LoRa mesh telemetry, and clinical response on Himalayan routes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link
            href="/problem"
            className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-rose-500/50 hover:shadow-xl transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white font-serif mb-1">The Crisis &amp; Problem</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              400+ pilgrims die annually from silent hypoxia, delayed cardiac discovery, and rugged terrain bottlenecks.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 group-hover:translate-x-1 transition-transform">
              Read Analysis <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/how-it-works"
            className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-cyan-500/50 hover:shadow-xl transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white font-serif mb-1">4-Stage Rescue Pipeline</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              From biometric wristband pulse monitoring $\to$ 15km LoRa mesh relay $\to$ automated 30s triage dispatch.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-500 group-hover:translate-x-1 transition-transform">
              Explore Pipeline <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/technology"
            className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500/50 hover:shadow-xl transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white font-serif mb-1">Hardware &amp; LoRa Mesh</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              MAX30102 optical PPG, MPU6050 6-axis IMU, SX1262 LoRa 915MHz transceivers with zero cellular dependence.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 group-hover:translate-x-1 transition-transform">
              Inspect Specs <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

        </div>
      </section>

    </div>
  );
}
