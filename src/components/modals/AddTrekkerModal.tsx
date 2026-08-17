'use client';

import React, { useState } from 'react';
import { useTrekSafe } from '@/context/TrekSafeContext';
import { X, UserPlus, ShieldAlert } from 'lucide-react';

interface AddTrekkerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTrekkerModal({ isOpen, onClose }: AddTrekkerModalProps) {
  const { addTrekker, showToast } = useTrekSafe();
  const [name, setName] = useState('');
  const [age, setAge] = useState<string>('65');
  const [condition, setCondition] = useState('None (Healthy)');
  const [movement, setMovement] = useState('Walking');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('⚠️ Please enter a pilgrim name');
      return;
    }
    const ageNum = parseInt(age) || 50;
    const isHigh = condition.includes('Cardiac') || condition.includes('Asthma');
    const isMed = condition.includes('Hypertension') || condition.includes('Diabetes');

    addTrekker({
      name: name.trim(),
      age: ageNum,
      medicalCondition: condition,
      riskLevel: isHigh ? 'high' : isMed ? 'med' : 'normal',
      hr: isHigh ? 96 : 82,
      spo2: isHigh ? 92 : 97,
      movement,
      lat: 32.9922 + (Math.random() - 0.5) * 0.003,
      lon: 74.9315 + (Math.random() - 0.5) * 0.003,
      routeIndex: 0
    });

    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-cyan-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white font-serif">Register New Pilgrim Band</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Pilgrim Full Name:</label>
            <input
              type="text"
              required
              placeholder="e.g. Om Prakash"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Age:</label>
              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Initial Activity:</label>
              <select
                value={movement}
                onChange={(e) => setMovement(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Walking">Walking</option>
                <option value="Climbing">Climbing</option>
                <option value="Resting">Resting</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              Pre-Existing Medical Screening:
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="None (Healthy)">None (Healthy / No History)</option>
              <option value="Cardiac History (CAD)">Cardiac History (Coronary Artery Disease / Bypass)</option>
              <option value="Asthma (Hypoxia Risk)">Asthma / COPD (High Hypoxia Risk)</option>
              <option value="Hypertension (High BP)">Hypertension (High Blood Pressure)</option>
              <option value="Diabetes Type-2">Diabetes Type-2</option>
              <option value="Acute Mountain Sickness (AMS)">Prior Acute Mountain Sickness (AMS)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm shadow-md transition-all mt-2"
          >
            ➕ Register &amp; Start Satellite Tracking
          </button>

        </form>

      </div>
    </div>
  );
}
