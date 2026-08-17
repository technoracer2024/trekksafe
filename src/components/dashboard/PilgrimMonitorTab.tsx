'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useTrekSafe, HELP_CENTERS } from '@/context/TrekSafeContext';
import { Heart, Activity, Wind, Radio, Zap, CheckCircle2, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DynamicSatelliteMap = dynamic(() => import('@/components/map/SatelliteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[340px] bg-slate-950 flex flex-col items-center justify-center text-cyan-400 font-mono text-sm gap-2">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      <span>Loading Ultra-HD Satellite Imagery...</span>
    </div>
  )
});

export default function PilgrimMonitorTab() {
  const {
    trekkers,
    selectedTrekker,
    selectTrekker,
    completedTrekkers,
    markCompleted,
    userLiveCoords,
    vitalsHistory,
    isDark
  } = useTrekSafe();

  const selected = selectedTrekker || trekkers[0];

  const isFallen = selected?.movement?.includes('FALL');
  const isFinished = selected?.movement?.includes('Finished');
  const hrColor = (selected?.hr || 0) > 120 || isFallen ? 'text-red-500' : (selected?.hr || 0) > 100 ? 'text-amber-500' : 'text-cyan-400';
  const spo2Color = (selected?.spo2 || 100) < 90 || isFallen ? 'text-red-500' : (selected?.spo2 || 100) < 94 ? 'text-amber-500' : 'text-emerald-400';

  const chartData = {
    labels: vitalsHistory.labels,
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: vitalsHistory.hr,
        borderColor: '#06B6D4',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true
      },
      {
        label: 'SpO₂ Oxygen (%)',
        data: vitalsHistory.spo2,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
        yAxisID: 'y2'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#94A3B8' : '#475569',
          font: { family: 'JetBrains Mono', size: 10 }
        }
      }
    },
    scales: {
      x: { display: false },
      y: {
        position: 'left' as const,
        min: 50,
        max: 170,
        grid: { color: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#06B6D4', font: { family: 'JetBrains Mono', size: 9 }, stepSize: 30 }
      },
      y2: {
        position: 'right' as const,
        min: 80,
        max: 100,
        grid: { drawOnChartArea: false },
        ticks: { color: '#10B981', font: { family: 'JetBrains Mono', size: 9 } }
      }
    }
  };

  const getConditionChipClass = (cond: string) => {
    const c = cond.toLowerCase();
    if (c.includes('cardiac') || c.includes('heart')) return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    if (c.includes('asthma') || c.includes('respiratory') || c.includes('hypoxia')) return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    if (c.includes('hypertension') || c.includes('bp')) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (c.includes('diabetes')) return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900">
      
      {/* ── LEFT SIDEBAR: ACTIVE TREKKERS ── */}
      <div className="lg:col-span-3 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-950/60 max-h-[780px]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Trekkers</div>
          <div className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border border-cyan-500/25">
            {trekkers.length} Active
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {trekkers.map(t => {
            const isSel = selected?.id === t.id;
            const tFallen = t.movement?.includes('FALL');
            const tFinished = t.movement?.includes('Finished');

            return (
              <div
                key={t.id}
                onClick={() => selectTrekker(t.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isSel
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-cyan-500/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                } ${t.isUser ? 'ring-1 ring-cyan-400/40' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div>
                    <div className={`text-sm font-bold truncate ${t.isUser ? 'text-cyan-600 dark:text-cyan-400 font-extrabold' : 'text-slate-800 dark:text-slate-200'}`}>
                      {t.name}
                    </div>
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border mt-0.5 ${getConditionChipClass(t.medicalCondition)}`}>
                      🩺 {t.medicalCondition}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {t.isUser ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-sm">
                        {t.isLiveHw ? '⚡ LIVE HW' : '📍 YOU'}
                      </span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); markCompleted(t.id); }}
                        className="px-2 py-0.5 text-[10px] font-medium rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
                      >
                        ✓ Done
                      </button>
                    )}
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      t.status === 'green' ? 'bg-emerald-500' : t.status === 'amber' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-ping'
                    }`} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs font-mono">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{t.hr}</span>
                    <span className="text-[9px] text-slate-400 ml-1">BPM</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{t.spo2}%</span>
                    <span className="text-[9px] text-slate-400 ml-1">SpO₂</span>
                  </div>
                  <div className="text-right truncate">
                    <span className={`text-[10px] font-semibold ${tFallen ? 'text-red-500 font-bold' : tFinished ? 'text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {tFallen ? '⚠️ FALL' : tFinished ? '🏆 BHAWAN' : t.movement}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {completedTrekkers.length > 0 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-emerald-500/5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Reached Shrine Today ({completedTrekkers.length})
            </div>
            <div className="max-h-24 overflow-y-auto space-y-1 text-xs text-slate-600 dark:text-slate-400">
              {completedTrekkers.map(c => (
                <div key={c.id} className="truncate">✓ {c.name} · {c.completedAt}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CENTER: SATELLITE MAP + VITALS TELEMETRY + ECG ── */}
      <div className="lg:col-span-6 flex flex-col border-r border-slate-200 dark:border-slate-800">
        {/* Leaflet Satellite Map */}
        <div className="relative min-h-[340px] h-[360px]">
          <DynamicSatelliteMap />
        </div>

        {/* Real-time Vitals Metric Bar */}
        <div className="grid grid-cols-3 border-t border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          
          {/* Heart Rate */}
          <div className="p-3.5 border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500" /> Heart Rate</span>
              <span className="text-[9px] font-mono">BPM</span>
            </div>
            <div className={`text-3xl font-extrabold font-serif leading-none ${hrColor}`}>
              {selected?.hr || '--'}
            </div>
            {/* Animated ECG Waveform */}
            <div className="w-full h-6 overflow-hidden my-1 bg-cyan-500/5 dark:bg-cyan-500/10 rounded">
              <svg className="w-[200%] h-full animate-ecg" viewBox="0 0 400 30" preserveAspectRatio="none">
                <path
                  d="M0,15 L40,15 L50,15 L55,4 L60,26 L65,7 L70,22 L75,15 L100,15 L140,15 L150,15 L155,4 L160,26 L165,7 L170,22 L175,15 L200,15 L240,15 L250,15 L255,4 L260,26 L265,7 L270,22 L275,15 L300,15 L340,15 L350,15 L355,4 L360,26 L365,7 L370,22 L375,15 L400,15"
                  className={`fill-none stroke-current stroke-[1.8] ${isFallen ? 'text-red-500' : 'text-cyan-400'}`}
                />
              </svg>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {selected?.isUser ? (selected.isLiveHw ? 'ESP8266 Live Pulse' : 'Your Live Vitals') : `Age ${selected?.age} · ${selected?.medicalCondition}`}
            </div>
          </div>

          {/* Blood Oxygen SpO2 */}
          <div className="p-3.5 border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              <span className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-cyan-400" /> Blood Oxygen</span>
              <span className="text-[9px] font-mono">% SpO₂</span>
            </div>
            <div className={`text-3xl font-extrabold font-serif leading-none ${spo2Color}`}>
              {selected?.spo2 ? `${selected.spo2}%` : '--'}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden my-3">
              <div
                className={`h-full transition-all duration-500 ${
                  (selected?.spo2 || 0) < 90 ? 'bg-red-500' : (selected?.spo2 || 0) < 94 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${selected?.spo2 || 0}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {(selected?.spo2 || 0) < 90 ? '⚠️ Severe Hypoxia Warning' : (selected?.spo2 || 0) < 94 ? 'Elevated Pulse · Oxygen Moderate' : 'Normal Respiration'}
            </div>
          </div>

          {/* Movement & IMU */}
          <div className="p-3.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-400" /> Movement</span>
              <span className="text-[9px] font-mono">MPU6050</span>
            </div>
            <div className={`text-base font-bold font-mono mt-2 truncate ${isFallen ? 'text-red-500 font-extrabold animate-pulse' : 'text-slate-800 dark:text-slate-200'}`}>
              {isFallen ? '⚠️ FALL DETECTED' : isFinished ? '🏆 Bhawan Shrine' : selected?.movement || '--'}
            </div>
            <div className="text-[10px] text-slate-400 mt-5 truncate">
              {isFallen ? 'Impact: 6-Axis Freefall Spike' : '6-Axis IMU Sensor Active'}
            </div>
          </div>
        </div>

        {/* Historical Chart */}
        <div className="p-3.5 h-44 bg-white dark:bg-slate-900">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
            <span>Telemetry History · <strong className="text-cyan-400">{selected?.name}</strong></span>
            <span className="text-[9px]">Live 2.4s Sampling</span>
          </div>
          <div className="w-full h-36">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: DEVICE TELEMETRY & NETWORK ── */}
      <div className="lg:col-span-3 flex flex-col bg-slate-50 dark:bg-slate-950/60 p-4 space-y-4 text-xs font-mono">
        
        {/* Device Info */}
        <div className="space-y-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Device Status</div>
          <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Trekker:</span>
            <strong className="text-cyan-600 dark:text-cyan-400 font-sans">{selected?.name}</strong>
          </div>
          <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Device GPS:</span>
            <span className="text-[11px]">
              {selected?.isUser && userLiveCoords.lat ? (
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{userLiveCoords.lat.toFixed(4)}°, {userLiveCoords.lon?.toFixed(4)}° (±{userLiveCoords.accuracy}m)</span>
              ) : (
                <span>{selected?.lat.toFixed(4)}°, {selected?.lon.toFixed(4)}°</span>
              )}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-slate-800 dark:text-slate-200">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Battery:</span>
              <span className="font-semibold">{selected?.battery || 88}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${selected?.battery || 88}%` }} />
            </div>
          </div>
          <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Altitude:</span>
            <span className="font-semibold">{selected?.isUser && userLiveCoords.altitude ? userLiveCoords.altitude : '2,847 m'}</span>
          </div>
        </div>

        {/* Network Telemetry */}
        <div className="space-y-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mesh Telemetry</div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400 font-medium">LoRa 915MHz:</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">ONLINE</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Gateway:</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">CONNECTED</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400 font-medium">GSM Fallback:</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">STANDBY</span>
          </div>
        </div>

        {/* Help Centers */}
        <div className="space-y-2 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Help Centres &amp; Responder Posts</div>
          {HELP_CENTERS.map(hc => (
            <div
              key={hc.id}
              className={`p-2.5 rounded-lg border transition-all ${
                hc.id === 'hc2' 
                  ? 'border-cyan-500/40 bg-cyan-500/10' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">{hc.name}</span>
                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">{hc.distance}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{hc.status}</span>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
