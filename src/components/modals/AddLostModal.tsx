'use client';

import React, { useState } from 'react';
import { useTrekSafe } from '@/context/TrekSafeContext';
import { X, UserSearch } from 'lucide-react';

interface AddLostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddLostModal({ isOpen, onClose }: AddLostModalProps) {
  const { addLostPerson, showToast } = useTrekSafe();
  const [name, setName] = useState('');
  const [age, setAge] = useState<string>('9');
  const [type, setType] = useState<'child' | 'elder' | 'infirm'>('child');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('⚠️ Please enter missing person name');
      return;
    }
    const ageNum = parseInt(age) || 10;
    addLostPerson({
      name: name.trim(),
      age: ageNum,
      type,
      lat: 33.0000 + Math.random() * 0.0300,
      lon: 74.9350 + Math.random() * 0.0200,
      status: 'red',
      dist: `${(Math.random() * 2.5 + 0.5).toFixed(1)} km`,
      batt: `${Math.floor(Math.random() * 40 + 50)}%`,
      lastSeen: 'Just now'
    });

    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserSearch className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white font-serif">Add Missing Person to Radar</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Name:</label>
            <input
              type="text"
              required
              placeholder="e.g. Diya Rawat"
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
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Category:</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="child">Child (Separated)</option>
                <option value="elder">Elder (Delayed / Disoriented)</option>
                <option value="infirm">Infirm / Differently Abled</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition-all mt-2"
          >
            🚨 Activate Search Perimeter
          </button>

        </form>

      </div>
    </div>
  );
}
