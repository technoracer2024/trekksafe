'use client';

import React, { useEffect } from 'react';
import { useTrekSafe } from '@/context/TrekSafeContext';
import { AlertOctagon, PhoneCall, ShieldX, Ambulance, CheckCircle2 } from 'lucide-react';

export default function EmergencyAlertModal() {
  const { emergencyAlert, cancelAlert, dispatchRescueNow } = useTrekSafe();

  const { active, name, hr, spo2, reason, countdown, dispatched } = emergencyAlert;

  // Web Audio emergency pulse beeper
  useEffect(() => {
    if (!active || dispatched) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 400);
    } catch (e) {}
  }, [active, countdown, dispatched]);

  if (!active) return null;

  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = ((30 - countdown) / 30) * circumference;

  return (
    <>
      {/* Red Screen Vignette Flash */}
      <div className={`screen-vignette ${active ? 'active' : ''}`} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <div className="w-full max-w-md rounded-2xl border-2 border-red-500 bg-slate-900 shadow-2xl p-6 text-center text-white space-y-4">
          
          <div className="flex items-center justify-center gap-2 text-red-500">
            <AlertOctagon className="w-8 h-8 animate-bounce" />
            <h2 className="text-xl font-black font-serif uppercase tracking-wide">Medical Emergency Alert</h2>
          </div>

          <p className="text-xs text-slate-300 font-mono">
            Unresponsive telemetry trigger received via LoRa Mesh Gateway Post
          </p>

          {/* Countdown Ring */}
          {!dispatched ? (
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="56" cy="56" r="44" stroke="#334155" strokeWidth="6" fill="transparent" />
                <circle
                  cx="56"
                  cy="56"
                  r="44"
                  stroke="#EF4444"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-3xl font-black font-serif text-red-400">{countdown}</div>
                <div className="text-[9px] uppercase font-mono text-slate-400">Secs to Rescue</div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 mx-auto" />
              <div className="font-bold text-sm">RESCUE TEAM DISPATCHED!</div>
              <p className="text-[11px] text-slate-300">Rapid Response Unit #2 En Route from HC-2 Mid Route (ETA 3 mins)</p>
            </div>
          )}

          {/* Patient Details Box */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-xs font-mono space-y-1.5">
            <div><strong>Trekker:</strong> <span className="text-cyan-400">{name}</span></div>
            <div className="flex gap-4">
              <div><strong>Heart Rate:</strong> <span className="text-red-400 font-bold">{hr} BPM</span></div>
              <div><strong>SpO₂:</strong> <span className="text-red-400 font-bold">{spo2}%</span></div>
            </div>
            <div className="text-amber-400 text-[11px]">⚠️ {reason}</div>
            <div className="text-[10px] text-slate-400">📍 Near HC-2 Adhkuwari (~1.2 km from Katra)</div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={cancelAlert}
              className="py-2.5 px-4 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
            >
              Cancel (False Alarm)
            </button>
            <button
              onClick={dispatchRescueNow}
              disabled={dispatched}
              className="py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg"
            >
              <Ambulance className="w-4 h-4" /> Dispatch Now
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
