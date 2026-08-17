'use client';

import React, { useEffect, useRef } from 'react';
import { useTrekSafe, VAISHNO_DEVI_TRACK, HELP_CENTERS } from '@/context/TrekSafeContext';

export default function SatelliteMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<{ [key: number]: any }>({});
  const polylineRef = useRef<any>(null);

  const {
    trekkers,
    selectedTrekker,
    selectTrekker,
    updateUserLocation,
    isSatelliteMode,
    setIsSatelliteMode,
    isDark
  } = useTrekSafe();

  const accuracyCircleRef = useRef<any>(null);

  const GOOGLE_SAT_URL = 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
  const ESRI_SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const TOPO_DARK_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const TOPO_LIGHT_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  // Initialize Leaflet Map
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
          zoomControl: false,
          scrollWheelZoom: true,
          attributionControl: false
        });

        // Position zoom controls cleanly at bottom-left
        L.control.zoom({ position: 'bottomleft' }).addTo(map);

        const activeTileUrl = isSatelliteMode
          ? GOOGLE_SAT_URL
          : (isDark ? TOPO_DARK_URL : TOPO_LIGHT_URL);

        const tileLayer = L.tileLayer(activeTileUrl, {
          maxZoom: 20,
          subdomains: isSatelliteMode ? ['0', '1', '2', '3'] : ['a', 'b', 'c', 'd']
        }).addTo(map);

        tileLayerRef.current = tileLayer;

        // Glowing Vaishno Devi route trail
        const routeLine = L.polyline(VAISHNO_DEVI_TRACK, {
          color: '#22D3EE',
          weight: 4.5,
          opacity: 0.95,
          dashArray: '8, 8',
          className: 'glowing-route-line'
        }).addTo(map);
        polylineRef.current = routeLine;

        // Help Center Responder Posts
        HELP_CENTERS.forEach(hc => {
          const hcIcon = L.divIcon({
            className: 'osm-custom-hc',
            html: `<div class="osm-hc-icon">🏥 ${hc.name}</div>`,
            iconSize: [110, 22],
            iconAnchor: [55, 11]
          });
          L.marker([hc.lat, hc.lon], { icon: hcIcon }).addTo(map)
            .bindPopup(`<b>${hc.name}</b><br><span style="font-size:11px;color:#10B981">🟢 Active Gateway & Responder Post</span>`);
        });

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

  // Update Tile Layer on Mode Switch
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const activeTileUrl = isSatelliteMode
      ? GOOGLE_SAT_URL
      : (isDark ? TOPO_DARK_URL : TOPO_LIGHT_URL);
    tileLayerRef.current.setUrl(activeTileUrl);
  }, [isSatelliteMode, isDark]);

  // Update Trekker Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    async function updateMarkers() {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;
      if (!map) return;

      trekkers.forEach(t => {
        if (!t.lat || !t.lon) return;

        const isFallen = t.movement && t.movement.includes('FALL');
        const dotClass = isFallen ? 'red' : t.isUser ? 'you' : t.status;
        const badgeHtml = t.isUser 
          ? `<span class="osm-pin-badge you">${t.isLiveHw ? '⚡ LIVE HW' : '📍 YOU'}</span>` 
          : `<span class="osm-pin-badge">${t.name.split(' ')[0]}</span>`;

        const iconHtml = `
          <div class="osm-pin-wrap">
            ${badgeHtml}
            <div class="osm-pin-dot ${dotClass}"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'osm-custom-pin',
          html: iconHtml,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        if (markersRef.current[t.id]) {
          markersRef.current[t.id].setLatLng([t.lat, t.lon]);
          markersRef.current[t.id].setIcon(customIcon);
        } else {
          const marker = L.marker([t.lat, t.lon], { 
            icon: customIcon,
            draggable: !!t.isUser
          }).addTo(map);

          marker.on('click', () => selectTrekker(t.id));

          if (t.isUser) {
            marker.on('dragend', (e: any) => {
              const pos = e.target.getLatLng();
              updateUserLocation(pos.lat, pos.lng, 2);
            });
          }

          markersRef.current[t.id] = marker;
        }

        // GPS Accuracy circle for user device
        if (t.isUser) {
          const accRadius = Math.max(8, Math.min(100, t.accuracy || 25));
          if (accuracyCircleRef.current) {
            accuracyCircleRef.current.setLatLng([t.lat, t.lon]);
            accuracyCircleRef.current.setRadius(accRadius);
          } else {
            accuracyCircleRef.current = L.circle([t.lat, t.lon], {
              radius: accRadius,
              color: '#22D3EE',
              fillColor: '#06B6D4',
              fillOpacity: 0.12,
              weight: 1.5,
              dashArray: '4, 4'
            }).addTo(map);
          }
        }

        const userDragTip = t.isUser 
          ? '<br><span style="font-size:10px;color:#22D3EE;font-weight:bold;">💡 Drag pin to calibrate exact location</span>' 
          : '';

        markersRef.current[t.id].bindPopup(`
          <div style="font-size:12px;padding:2px;">
            <b style="color:#06B6D4;">${t.name}</b> (${t.age})<br>
            <span style="font-size:10px;color:#F59E0B;">🩺 ${t.medicalCondition}</span><br>
            ❤️ <b>${t.hr}</b> BPM &nbsp; 🫁 <b>${t.spo2}%</b> SpO₂ · 🏃 ${t.movement}<br>
            <span style="font-size:10px;color:#94A3B8;">📍 ${t.lat.toFixed(5)}°, ${t.lon.toFixed(5)}°</span>
            ${userDragTip}
          </div>
        `);
      });

      // Remove deleted markers
      Object.keys(markersRef.current).forEach(idStr => {
        const id = parseInt(idStr);
        if (!trekkers.find(t => t.id === id)) {
          map.removeLayer(markersRef.current[id]);
          delete markersRef.current[id];
        }
      });
    }

    updateMarkers();
  }, [trekkers, selectTrekker, updateUserLocation]);

  // Center on Selected Trekker
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedTrekker) return;
    if (selectedTrekker.lat && selectedTrekker.lon) {
      mapInstanceRef.current.panTo([selectedTrekker.lat, selectedTrekker.lon], { animate: true, duration: 0.8 });
    }
  }, [selectedTrekker?.id]);

  return (
    <div className="relative w-full h-full min-h-[340px] bg-slate-950 overflow-hidden rounded-t-lg">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Satellite Mode Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        {isSatelliteMode ? '🛰️ ULTRA-HD SATELLITE IMAGERY' : '🗺️ TOPOGRAPHIC TERRAIN VIEW'}
      </div>

      {/* Layer Toggle Button */}
      <button
        onClick={() => setIsSatelliteMode(prev => !prev)}
        className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900/85 hover:bg-cyan-900/60 backdrop-blur-md border border-cyan-500/50 text-[10px] font-mono font-bold text-slate-100 hover:text-white transition-all shadow-lg hover:-translate-y-0.5"
      >
        <span>{isSatelliteMode ? '🗺️' : '🛰️'}</span>
        <span>{isSatelliteMode ? 'Switch to Topo' : 'Switch to Satellite'}</span>
      </button>

      {/* Map Legend */}
      <div className="absolute bottom-3 right-3 z-10 p-2.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-700/60 text-[10px] space-y-1 shadow-xl">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Help Centre</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Safe (Normal)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Warning (Elevated)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>Emergency (Fall / Hypoxia)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
          <span className="font-semibold text-cyan-300">You (Live GPS)</span>
        </div>
      </div>
    </div>
  );
}
