'use client';

import React from 'react';
import { HeartPulse, Clock, Building2, IndianRupee } from 'lucide-react';

export default function HeroStatsStrip() {
  const stats = [
    {
      icon: <HeartPulse className="w-5 h-5 text-rose-500" />,
      value: '400+',
      label: 'Lives Protected / Year',
      sub: 'Annual Himalayan Preventable Toll',
      progress: 'w-full bg-rose-500'
    },
    {
      icon: <Clock className="w-5 h-5 text-cyan-500" />,
      value: '<30s',
      label: 'Detection to Response',
      sub: 'vs 45-90 min manual discovery',
      progress: 'w-3/4 bg-cyan-500'
    },
    {
      icon: <Building2 className="w-5 h-5 text-emerald-500" />,
      value: '4 Outposts',
      label: 'Active Responder Posts',
      sub: 'Katra, Banganga, Adhkuwari, Bhawan',
      progress: 'w-1/2 bg-emerald-500'
    },
    {
      icon: <IndianRupee className="w-5 h-5 text-amber-500" />,
      value: '₹50/Day',
      label: 'Per Pilgrim Band',
      sub: 'Zero cellular or sim overhead',
      progress: 'w-1/4 bg-amber-500'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, idx) => (
        <div
          key={idx}
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-lg hover:border-cyan-500/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
              {s.icon}
            </span>
            <span className="text-2xl font-black font-serif text-slate-900 dark:text-white">
              {s.value}
            </span>
          </div>

          <div className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-0.5">
            {s.label}
          </div>
          <div className="text-[11px] text-slate-400">
            {s.sub}
          </div>

          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
            <div className={`h-full ${s.progress} rounded-full`} />
          </div>
        </div>
      ))}
    </div>
  );
}
