'use client';

import React, { useState } from 'react';
import { useTrekSafe, VAISHNO_DEVI_TRACK } from '@/context/TrekSafeContext';
import { X, MapPin, Compass, Check, Crosshair, Navigation, LocateFixed } from 'lucide-react';

interface LocationCalibrateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationCalibrateModal({ isOpen, onClose }: LocationCalibrateModalProps) {
  const { userLiveCoords, updateUserLocation, showToast, selectTrekker, trekkers } = useTrekSafe();

  const userTrekker = trekkers.find(t => t.isUser) || trekkers[0];

  const [customLat, setCustomLat] = useState<string>(userTrekker.lat ? userTrekker.lat.toFixed(5) : '33.0080');
  const [customLon, setCustomLon] = useState<string>(userTrekker.lon ? userTrekker.lon.toFixed(5) : '74.9430');

  if (!isOpen) return null;

  const checkpoints = [
    { name: 'Faridabad Home Lab (Your Location)', lat: 28.4089, lon: 77.3178, alt: '215 m' },
    { name: 'Katra Base Camp (Start)', lat: 32.9922, lon: 74.9315, alt: '754 m' },
    { name: 'Banganga Checkpoint / HC-1', lat: 33.0035, lon: 74.9405, alt: '920 m' },
    { name: 'Charan Paduka Shrine', lat: 33.0105, lon: 74.9440, alt: '1,050 m' },
    { name: 'Adhkuwari Mid Route / HC-2', lat: 33.0185, lon: 74.9490, alt: '1,460 m' },
    { name: 'Himkoti Viewpoint', lat: 33.0245, lon: 74.9525, alt: '1,680 m' },
    { name: 'Sanjichhat Ridge Pass', lat: 33.0280, lon: 74.9540, alt: '1,820 m' },
    { name: 'Bhawan Holy Shrine / HC-3', lat: 33.0305, lon: 74.9565, alt: '1,585 m' }
  ];

  const handleApplyPreset = (lat: number, lon: number, name: string) => {
    updateUserLocation(lat, lon, 2);
    selectTrekker(0);
    showToast(`🎯 Position snapped to: ${name}`);
    onClose();
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (isNaN(lat) || isNaN(lon)) {
      showToast('⚠️ Please enter valid numeric coordinates');
      return;
    }
    updateUserLocation(lat, lon, 2);
    selectTrekker(0);
    showToast(`🎯 Position calibrated to: ${lat.toFixed(5)}°, ${lon.toFixed(5)}°`);
    onClose();
  };

  const reacquireBrowserGps = () => {
    if (!navigator.geolocation) {
      showToast('⚠️ Geolocation not supported by browser');
      return;
    }
    showToast('📍 Requesting high-accuracy browser GPS fix...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        updateUserLocation(latitude, longitude, accuracy);
        selectTrekker(0);
        showToast(`📍 GPS Fix: ${latitude.toFixed(5)}°, ${longitude.toFixed(5)}° (±${Math.round(accuracy)}m)`);
        onClose();
      },
      (err) => {
        showToast(`⚠️ GPS Notice: ${err.message}. Desktop browsers often estimate ±1km via IP.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-cyan-500 animate-pulse" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white font-serif">
              GPS Calibration &amp; Pinpoint Fix
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          
          {/* Explanation Notice */}
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-slate-700 dark:text-slate-300 space-y-1">
            <div className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
              <LocateFixed className="w-4 h-4" /> Why Desktop Browsers Are Off by ~1 km:
            </div>
            <p className="text-[11px] leading-relaxed">
              Desktop PCs lack dedicated satellite GPS chips and rely on approximate Wi-Fi / ISP IP triangulation (±1000m). On the satellite map, you can <strong>drag your pin directly</strong> or snap to exact trail checkpoints below.
            </p>
          </div>

          {/* Quick Trail Snapping */}
          <div className="space-y-2">
            <label className="block font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">
              Snap to Vaishno Devi Trail Landmark:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {checkpoints.map((cp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(cp.lat, cp.lon, cp.name)}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 bg-slate-50 dark:bg-slate-950 hover:bg-cyan-500/10 text-left transition-all group"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 truncate">
                    {cp.name}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>{cp.lat.toFixed(4)}°, {cp.lon.toFixed(4)}°</span>
                    <span className="text-cyan-500">{cp.alt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Coordinate Form */}
          <form onSubmit={handleApplyCustom} className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">
              Enter Exact Coordinates:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-mono mb-1">Latitude (°N)</label>
                <input
                  type="text"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-mono mb-1">Longitude (°E)</label>
                <input
                  type="text"
                  value={customLon}
                  onChange={(e) => setCustomLon(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={reacquireBrowserGps}
                className="py-2.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Navigation className="w-3.5 h-3.5" /> Re-poll Browser GPS
              </button>

              <button
                type="submit"
                className="py-2.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Set Exact Pinpoint
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}
