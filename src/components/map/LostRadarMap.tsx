'use client';

import React, { useEffect, useRef } from 'react';
import { useTrekSafe } from '@/context/TrekSafeContext';

export default function LostRadarMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: number]: any }>({});

  const {
    lostPersons,
    isSatelliteMode,
    setIsSatelliteMode,
    isDark
  } = useTrekSafe();

  const GOOGLE_SAT_URL = 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
  const TOPO_DARK_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const TOPO_LIGHT_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [33.0145, 74.9460],
          zoom: 13,
          zoomControl: true,
          scrollWheelZoom: true,
          attributionControl: false
        });

        const activeTileUrl = isSatelliteMode
          ? GOOGLE_SAT_URL
          : (isDark ? TOPO_DARK_URL : TOPO_LIGHT_URL);

        L.tileLayer(activeTileUrl, {
          maxZoom: 20,
          subdomains: isSatelliteMode ? ['0', '1', '2', '3'] : ['a', 'b', 'c', 'd']
        }).addTo(map);

        // Search Perimeter 2.6 km Circle
        L.circle([33.0145, 74.9460], {
          radius: 2600,
          color: '#22D3EE',
          weight: 2,
          fillColor: '#0891B2',
          fillOpacity: 0.12,
          dashArray: '6, 6'
        }).addTo(map);

        // Search Base
        const baseIcon = L.divIcon({
          className: 'osm-custom-hc',
          html: `<div class="osm-hc-icon">🚩 Search Base Point</div>`,
          iconSize: [130, 22],
          iconAnchor: [65, 11]
        });
        L.marker([32.9922, 74.9315], { icon: baseIcon }).addTo(map)
          .bindPopup('<b>Search Command Base</b><br><span style="font-size:11px">Katra Search & Rescue Ops</span>');

        mapInstanceRef.current = map;

        setTimeout(() => {
          if (map) map.invalidateSize();
        }, 250);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    async function updateLostPins() {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;
      if (!map) return;

      lostPersons.forEach(p => {
        const dotClass = p.status === 'red' ? 'red' : p.status === 'amber' ? 'amber' : 'green';
        const iconHtml = `
          <div class="osm-pin-wrap">
            <span class="osm-pin-badge">${p.name.split(' ')[0]}</span>
            <div class="osm-pin-dot ${dotClass}"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'osm-custom-pin',
          html: iconHtml,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        if (markersRef.current[p.id]) {
          markersRef.current[p.id].setLatLng([p.lat, p.lon]);
          markersRef.current[p.id].setIcon(customIcon);
        } else {
          const marker = L.marker([p.lat, p.lon], { icon: customIcon }).addTo(map);
          markersRef.current[p.id] = marker;
        }

        markersRef.current[p.id].bindPopup(`
          <div style="font-size:12px;">
            <b style="color:#06B6D4;">${p.name}</b> (Age ${p.age} · ${p.type.toUpperCase()})<br>
            📍 <b>Distance:</b> ${p.dist}<br>
            🔋 <b>Battery:</b> ${p.batt} · ⏱️ <b>Last Seen:</b> ${p.lastSeen}
          </div>
        `);
      });

      Object.keys(markersRef.current).forEach(idStr => {
        const id = parseInt(idStr);
        if (!lostPersons.find(p => p.id === id)) {
          map.removeLayer(markersRef.current[id]);
          delete markersRef.current[id];
        }
      });
    }

    updateLostPins();
  }, [lostPersons]);

  return (
    <div className="relative w-full h-full min-h-[340px] bg-slate-950 overflow-hidden rounded-t-lg">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        🛰️ SATELLITE SEARCH PERIMETER · GPS RADAR
      </div>

      <button
        onClick={() => setIsSatelliteMode(prev => !prev)}
        className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900/85 hover:bg-cyan-900/60 backdrop-blur-md border border-cyan-500/50 text-[10px] font-mono font-bold text-slate-100 transition-all shadow-lg hover:-translate-y-0.5"
      >
        <span>{isSatelliteMode ? '🗺️' : '🛰️'}</span>
        <span>{isSatelliteMode ? 'Switch to Topo' : 'Switch to Satellite'}</span>
      </button>

      <div className="absolute bottom-3 right-3 z-10 p-2.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-700/60 text-[10px] space-y-1 shadow-xl">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Search Base</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Located / Safe</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>Active Missing Signal</span>
        </div>
      </div>
    </div>
  );
}
