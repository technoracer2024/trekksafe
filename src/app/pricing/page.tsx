'use client';

import React from 'react';
import Link from 'next/link';
import { IndianRupee, Check, Shield, Building2, Sparkles, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const tiers = [
    {
      name: 'Pilgrim Daily Rental',
      price: '₹50',
      period: 'per day',
      desc: 'Issued at base camp entry counter and returned at final shrine exit.',
      features: [
        'IP68 Rugged Biometric Wristband',
        '24/7 Continuous SpO₂ & Heart Rate Tracking',
        'Automated Freefall & Impact Alerting',
        'Full LoRa Mesh Coverage on Entire Route',
        'Free Replacement on Battery Depletion'
      ],
      popular: true,
      btn: 'Available at Base Checkpoints'
    },
    {
      name: 'Temple Board Corridor Pilot',
      price: '₹2,49,000',
      period: 'one-time route setup',
      desc: 'Complete turnkey infrastructure for shrine management boards & district authorities.',
      features: [
        '500x Reusable Smart Pilgrim Bands',
        '4x Solar-Powered LoRa Repeater Outposts',
        'Command Center Web Console & Satellite Map',
        'Medic Smartphone Alert App Integration',
        'On-site Staff & Responder Training (7 Days)'
      ],
      popular: false,
      btn: 'Request Board Deployment'
    },
    {
      name: 'Disaster & NDRF Mission Pack',
      price: 'Custom',
      period: 'emergency tender',
      desc: 'Rapid-deployable telemetry kit for high-altitude search & rescue teams.',
      features: [
        'Rugged Pelican Case Mobile Command Base',
        '2,000x Long-Life Telemetry Beacons',
        'Helicopter Aerial LoRa Relay Node',
        'Offline Satellite Topo Map Caching',
        'Dedicated 24/7 Engineering Support'
      ],
      popular: false,
      btn: 'Contact NDRF Response Cell'
    }
  ];

  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
          <IndianRupee className="w-3.5 h-3.5" />
          ACCESSIBLE DEPLOYMENT TIERS
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-serif text-slate-900 dark:text-white tracking-tight">
          Life-Saving Technology <em>Priced for Everyone</em>.
        </h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Whether you are an individual pilgrim renting a band for a single trek or a shrine board managing 50,000 devotees a day, TrekSafe delivers ultra-low-cost safety.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((t, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl border flex flex-col justify-between transition-all relative ${
              t.popular
                ? 'border-cyan-500 bg-white dark:bg-slate-900 shadow-2xl ring-2 ring-cyan-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-lg'
            }`}
          >
            {t.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md">
                MOST POPULAR FOR PILGRIMS
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg font-serif text-slate-900 dark:text-white">{t.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.desc}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black font-serif text-slate-900 dark:text-white">{t.price}</span>
                <span className="text-xs text-slate-400 font-mono">/ {t.period}</span>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Includes:</div>
                {t.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                  t.popular
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                {t.btn} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
