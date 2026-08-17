'use client';

import React, { useState } from 'react';
import { useTrekSafe } from '@/context/TrekSafeContext';
import PilgrimMonitorTab from './PilgrimMonitorTab';
import MedicalAlertTab from './MedicalAlertTab';
import LostPersonTab from './LostPersonTab';
import HardwareSyncModal from '../modals/HardwareSyncModal';
import AddTrekkerModal from '../modals/AddTrekkerModal';
import AddLostModal from '../modals/AddLostModal';
import { Radio, AlertOctagon, UserPlus, Cpu, Activity, ShieldAlert, Users, Compass, Zap } from 'lucide-react';

export default function CommandCenter() {
  const {
    activeTab,
    setActiveTab,
    simulateFall,
    trekkers,
    hardwareConnected,
    showToast,
    selectTrekker
  } = useTrekSafe();

  const [showHwModal, setShowHwModal] = useState(false);
  const [showAddTrekkerModal, setShowAddTrekkerModal] = useState(false);
  const [showAddLostModal, setShowAddLostModal] = useState(false);

  const highRiskCount = trekkers.filter(t => t.riskLevel === 'high' || (t.medicalCondition && !t.medicalCondition.includes('Healthy'))).length;

  const requestGps = () => {
    if (!navigator.geolocation) {
      showToast('⚠️ Geolocation not supported');
      return;
    }
    showToast('📍 Acquiring live device GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        selectTrekker(0);
        showToast(`📍 GPS Locked: ${pos.coords.latitude.toFixed(4)}°, ${pos.coords.longitude.toFixed(4)}°`);
      },
      () => showToast('⚠️ Please allow location permission in browser'),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full space-y-6">
      
      {/* ── TOP HERO DASHBOARD HEADER ── */}
      <div className="text-center space-y-2 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          HIMALAYAN PILGRIM COMMAND CENTER · LIVE TELEMETRY
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight font-serif">
          Real-time <em>Telemetry</em> &amp; Automated <strong>Rescue Dispatch</strong>
        </h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Continuous SpO₂ hypoxia detection, fall impact alerting, and high-resolution satellite perimeter tracking for high-altitude pilgrimage routes.
        </p>
      </div>

      {/* ── ACTION CONTROLS TOOLBAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('pilgrim')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pilgrim'
                ? 'bg-cyan-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Pilgrim Monitor</span>
          </button>

          <button
            onClick={() => setActiveTab('medical')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === 'medical'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>High-Risk &amp; Medical Alert</span>
            {highRiskCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-rose-600 dark:bg-slate-950 dark:text-rose-400">
                {highRiskCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('lost')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'lost'
                ? 'bg-cyan-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Lost Person Radar</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={simulateFall}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-md hover:-translate-y-0.5"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>💥 Simulate Fall</span>
          </button>

          <button
            onClick={() => setShowHwModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border font-bold transition-all shadow-sm hover:-translate-y-0.5 ${
              hardwareConnected
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-cyan-500'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>{hardwareConnected ? '⚡ Hardware Live (115.2k)' : '⚡ Connect Hardware Prototype'}</span>
          </button>

          <button
            onClick={() => setShowAddTrekkerModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 dark:bg-cyan-500 hover:bg-slate-800 dark:hover:bg-cyan-400 text-white font-bold transition-all shadow-md hover:-translate-y-0.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>＋ Add Pilgrim</span>
          </button>

          <button
            onClick={requestGps}
            title="Lock and track device GPS position"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cyan-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            📍
          </button>
        </div>
      </div>

      {/* ── TAB CONTENT DISPLAY ── */}
      {activeTab === 'pilgrim' && <PilgrimMonitorTab />}
      {activeTab === 'medical' && <MedicalAlertTab />}
      {activeTab === 'lost' && <LostPersonTab onOpenAddLost={() => setShowAddLostModal(true)} />}

      {/* Modals */}
      <HardwareSyncModal isOpen={showHwModal} onClose={() => setShowHwModal(false)} />
      <AddTrekkerModal isOpen={showAddTrekkerModal} onClose={() => setShowAddTrekkerModal(false)} />
      <AddLostModal isOpen={showAddLostModal} onClose={() => setShowAddLostModal(false)} />

    </div>
  );
}
