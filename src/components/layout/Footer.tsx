'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Heart, MapPin, Radio, PhoneCall } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs py-12 px-4 sm:px-6 lg:px-8 mt-16 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Col 1: Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-base text-slate-900 dark:text-white">TREKSAFE</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Intelligent high-altitude health telemetry and emergency rescue dispatch for pilgrimage corridors. No cellular coverage required.
          </p>
          <div className="text-[10px] font-mono text-slate-400">
            © {new Date().getFullYear()} TrekSafe Autonomous Mesh Network.
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">Platform</div>
          <ul className="space-y-1.5 text-[11px]">
            <li><Link href="/" className="hover:text-cyan-500 transition-colors">Command Dashboard</Link></li>
            <li><Link href="/mission" className="hover:text-cyan-500 transition-colors">Mission &amp; Vision</Link></li>
            <li><Link href="/problem" className="hover:text-cyan-500 transition-colors">The Crisis &amp; Problem</Link></li>
            <li><Link href="/how-it-works" className="hover:text-cyan-500 transition-colors">Rescue Pipeline</Link></li>
            <li><Link href="/technology" className="hover:text-cyan-500 transition-colors">Sensor Architecture</Link></li>
            <li><Link href="/pricing" className="hover:text-cyan-500 transition-colors">Pilot Deployment &amp; Pricing</Link></li>
          </ul>
        </div>

        {/* Col 3: Deployments */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">Routes &amp; Shrines</div>
          <ul className="space-y-1.5 text-[11px]">
            <li className="flex items-center gap-1.5 text-cyan-500 font-semibold"><MapPin className="w-3 h-3" /> Vaishno Devi Corridor (Live Pilot)</li>
            <li className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-400" /> Amarnath Cave Route (Q3 2026)</li>
            <li className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-400" /> Kedarnath High Pass (Q4 2026)</li>
            <li className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-400" /> Hemkund Sahib (Planned)</li>
          </ul>
        </div>

        {/* Col 4: Emergency Contacts */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">Emergency Outpost</div>
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] space-y-1">
            <div className="font-bold text-slate-800 dark:text-slate-200">Adhkuwari HC-2 Command</div>
            <div className="text-slate-400">Radio Frequency: 915.2 MHz (Ch 4)</div>
            <div className="text-cyan-500 font-mono font-bold flex items-center gap-1 mt-1">
              <PhoneCall className="w-3 h-3" /> +91-1991-232000
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
