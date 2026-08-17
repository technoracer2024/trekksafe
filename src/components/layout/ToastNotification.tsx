'use client';

import React from 'react';
import { useTrekSafe } from '@/context/TrekSafeContext';

export default function ToastNotification() {
  const { toastMessage } = useTrekSafe();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-slate-900/95 text-cyan-300 font-mono text-xs shadow-2xl backdrop-blur-md animate-slide-up flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
      <span>{toastMessage}</span>
    </div>
  );
}
