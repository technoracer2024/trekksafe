'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTrekSafe } from '@/context/TrekSafeContext';
import { Shield, Moon, Sun, Radio, Activity, Zap } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { isDark, toggleTheme, hardwareConnected } = useTrekSafe();

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/mission', label: 'Mission' },
    { href: '/problem', label: 'The Problem' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/technology', label: 'Technology' },
    { href: '/pricing', label: 'Pricing' },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-md group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="font-serif font-black text-lg tracking-tight text-slate-900 dark:text-white leading-none">
              TREK<span className="text-cyan-500">SAFE</span>
            </div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-slate-400 leading-none mt-0.5">
              Himalayan Telemetry
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1 text-xs font-semibold">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'text-cyan-500 bg-cyan-500/10 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Action Icons & Theme Toggle */}
        <div className="flex items-center gap-2">
          
          {/* Hardware Prototype Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
            <span className={`w-2 h-2 rounded-full ${hardwareConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{hardwareConnected ? '⚡ LIVE HW' : 'RADIO 915M'}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-cyan-500 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-600" />}
          </button>

          {/* Emergency Hotline CTA */}
          <Link
            href="/"
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-white shadow-md transition-all hover:-translate-y-0.5"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Command</span>
          </Link>

        </div>

      </div>
    </nav>
  );
}
