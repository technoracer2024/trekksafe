'use client';

import React from 'react';
import { useTrekSafe } from '@/context/TrekSafeContext';
import { ShieldAlert, Heart, Wind, Stethoscope, Droplets, AlertCircle, Ambulance } from 'lucide-react';

export default function MedicalAlertTab() {
  const {
    trekkers,
    medFilter,
    setMedFilter,
    selectTrekker,
    selectedTrekker,
    deployOxygen,
    triggerEmergency
  } = useTrekSafe();

  const filteredTrekkers = trekkers.filter(t => {
    if (medFilter === 'all') return true;
    const cond = t.medicalCondition.toLowerCase();
    if (medFilter === 'cardiac') return cond.includes('cardiac') || cond.includes('heart');
    if (medFilter === 'asthma') return cond.includes('asthma') || cond.includes('respiratory') || cond.includes('hypoxia');
    if (medFilter === 'hypertension') return cond.includes('hypertension') || cond.includes('bp');
    if (medFilter === 'diabetes') return cond.includes('diabetes');
    return true;
  });

  const getConditionBadge = (cond: string) => {
    const c = cond.toLowerCase();
    if (c.includes('cardiac')) return { bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30', label: '❤️ Cardiac CAD' };
    if (c.includes('asthma') || c.includes('hypoxia')) return { bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30', label: '🫁 Asthma / Hypoxia' };
    if (c.includes('hypertension')) return { bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30', label: '🩺 Hypertension (High BP)' };
    if (c.includes('diabetes')) return { bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30', label: '🩸 Diabetes Type-2' };
    return { bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: '🟢 Healthy' };
  };

  return (
    <div className="space-y-4">
      
      {/* ── TOP FILTER CONTROLS ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Clinical Triage & Disease Screening Queue</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Continuous telemetry filtering for high-altitude pre-existing conditions</p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <button
            onClick={() => setMedFilter('all')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              medFilter === 'all'
                ? 'bg-cyan-500 text-white border-cyan-500 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-500'
            }`}
          >
            All Conditions ({trekkers.length})
          </button>
          <button
            onClick={() => setMedFilter('cardiac')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              medFilter === 'cardiac'
                ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-500'
            }`}
          >
            ❤️ Cardiac CAD
          </button>
          <button
            onClick={() => setMedFilter('asthma')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              medFilter === 'asthma'
                ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-500'
            }`}
          >
            🫁 Asthma / SpO₂
          </button>
          <button
            onClick={() => setMedFilter('hypertension')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              medFilter === 'hypertension'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500'
            }`}
          >
            🩺 Hypertension
          </button>
          <button
            onClick={() => setMedFilter('diabetes')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              medFilter === 'diabetes'
                ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-500'
            }`}
          >
            🩸 Diabetes
          </button>
        </div>
      </div>

      {/* ── CARDS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrekkers.map(t => {
          const isCritical = t.spo2 < 91 || t.hr > 125 || (t.movement && t.movement.includes('FALL'));
          const isWarn = t.spo2 < 94 || t.hr > 105 || t.riskLevel === 'high';
          const badge = getConditionBadge(t.medicalCondition);

          return (
            <div
              key={t.id}
              onClick={() => selectTrekker(t.id)}
              className={`p-4 rounded-xl border transition-all bg-white dark:bg-slate-900 cursor-pointer ${
                isCritical 
                  ? 'border-red-500/80 ring-2 ring-red-500/20 bg-red-500/5' 
                  : isWarn 
                  ? 'border-amber-500/60 ring-1 ring-amber-500/20 bg-amber-500/5' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-cyan-500/50'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{t.name}</h4>
                  <p className="text-xs text-slate-400">Age {t.age} · {t.isUser ? 'This Device' : 'Pilgrim Band'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>

              {/* Hypoxia Risk Bar */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Hypoxia Risk (Oxygen Saturation)</span>
                  <strong className={t.spo2 < 90 ? 'text-red-500' : t.spo2 < 94 ? 'text-amber-500' : 'text-emerald-500'}>
                    {t.spo2}% SpO₂
                  </strong>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      t.spo2 < 90 ? 'bg-red-500' : t.spo2 < 94 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${t.spo2}%` }}
                  />
                </div>
              </div>

              {/* Vitals Numbers */}
              <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Heart Rate</div>
                  <div className="text-base font-bold font-serif text-slate-900 dark:text-slate-100">{t.hr} <span className="text-[10px] font-sans font-normal">BPM</span></div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Activity</div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 truncate">{t.movement}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Triage Tier</div>
                  <div className={`text-xs font-bold mt-1 ${isCritical ? 'text-red-500' : isWarn ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {isCritical ? 'CRITICAL' : isWarn ? 'MONITOR' : 'NORMAL'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); deployOxygen(t.name); }}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 dark:text-sky-400 border border-sky-500/30 text-xs font-semibold transition-colors"
                >
                  <Wind className="w-3.5 h-3.5" /> 🫁 Oxygen Support
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); triggerEmergency(t.name, t.hr, t.spo2, `Medical Triage Alert: ${t.medicalCondition}`); }}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
                >
                  <Ambulance className="w-3.5 h-3.5" /> 🚑 Rescue Dispatch
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
