'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTrekSafe } from '@/context/TrekSafeContext';
import { Radio, Search, UserX, AlertTriangle, ShieldCheck, Plus, Trash2 } from 'lucide-react';

const DynamicLostRadarMap = dynamic(() => import('@/components/map/LostRadarMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[340px] bg-slate-950 flex flex-col items-center justify-center text-cyan-400 font-mono text-sm gap-2">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      <span>Loading Satellite Perimeter Radar...</span>
    </div>
  )
});

interface LostPersonTabProps {
  onOpenAddLost: () => void;
}

export default function LostPersonTab({ onOpenAddLost }: LostPersonTabProps) {
  const {
    lostPersons,
    removeLostPerson,
    triggerEmergency
  } = useTrekSafe();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  const filtered = lostPersons.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && p.type !== filterType) return false;
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900">
      
      {/* ── LEFT SIDEBAR: LOST PERSONS LIST ── */}
      <div className="lg:col-span-4 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-950/60 max-h-[720px]">
        
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search missing pilgrim..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterType(null)}
              className={`px-3 py-1 rounded-md border text-xs font-semibold transition-all ${
                filterType === null
                  ? 'bg-cyan-500 text-white border-cyan-500'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              All ({lostPersons.length})
            </button>
            <button
              onClick={() => setFilterType('child')}
              className={`px-3 py-1 rounded-md border text-xs font-semibold transition-all ${
                filterType === 'child'
                  ? 'bg-cyan-500 text-white border-cyan-500'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              Children
            </button>
            <button
              onClick={() => setFilterType('elder')}
              className={`px-3 py-1 rounded-md border text-xs font-semibold transition-all ${
                filterType === 'elder'
                  ? 'bg-cyan-500 text-white border-cyan-500'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              Elders
            </button>
          </div>
        </div>

        {/* Cards List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filtered.map(p => (
            <div
              key={p.id}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-500/50 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.name}</h4>
                  <p className="text-[10px] text-slate-400">Age {p.age} · Category: <span className="uppercase font-semibold text-cyan-400">{p.type}</span></p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    p.status === 'red' ? 'bg-red-500 animate-ping' : p.status === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <button
                    onClick={() => removeLostPerson(p.id)}
                    title="Remove from tracking"
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono">
                <div>
                  <div className="text-[9px] text-slate-400">Distance</div>
                  <strong className="text-slate-800 dark:text-slate-200">{p.dist}</strong>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400">Battery</div>
                  <strong className="text-slate-800 dark:text-slate-200">{p.batt}</strong>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400">Last Seen</div>
                  <strong className="text-slate-800 dark:text-slate-200">{p.lastSeen}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Add Button */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onOpenAddLost}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Person to Track
          </button>
        </div>

      </div>

      {/* ── RIGHT: LOST RADAR SATELLITE MAP + STATS ── */}
      <div className="lg:col-span-8 flex flex-col">
        <div className="relative min-h-[380px] h-[400px]">
          <DynamicLostRadarMap />
        </div>

        {/* Summary Metric Strip */}
        <div className="grid grid-cols-3 border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/40 text-center font-mono">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Search Zone Radius</div>
            <div className="text-xl font-bold font-serif text-cyan-400 mt-0.5">2.6 km²</div>
            <div className="text-[10px] text-slate-500">Active Geofence</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Triangulation Mesh</div>
            <div className="text-xl font-bold font-serif text-emerald-400 mt-0.5">3 Outposts</div>
            <div className="text-[10px] text-slate-500">Signal Accuracy ±4m</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Rescue Protocol</div>
            <div className="text-xl font-bold font-serif text-amber-400 mt-0.5">&lt; 90 Secs</div>
            <div className="text-[10px] text-slate-500">Base Responder Dispatch</div>
          </div>
        </div>
      </div>

    </div>
  );
}
