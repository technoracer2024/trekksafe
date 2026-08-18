'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Trekker, LostPerson, HelpCenter, CompletedTrekker, RiskLevel } from '@/types/treksafe';

export const VAISHNO_DEVI_TRACK: [number, number][] = [
  [32.9922, 74.9315], // 0: Katra Base
  [33.0035, 74.9405], // 1: Banganga Checkpoint / HC-1
  [33.0105, 74.9440], // 2: Charan Paduka
  [33.0185, 74.9490], // 3: Adhkuwari Mid Route / HC-2
  [33.0245, 74.9525], // 4: Himkoti
  [33.0280, 74.9540], // 5: Sanjichhat
  [33.0305, 74.9565]  // 6: Bhawan Shrine / HC-3
];

export const HELP_CENTERS: HelpCenter[] = [
  { id: 'hc1', name: 'HC-1 Katra Base', lat: 32.9922, lon: 74.9315, distance: '3.8 km', status: '1 on route' },
  { id: 'hc2', name: 'HC-2 Mid Route', lat: 33.0185, lon: 74.9490, distance: '1.2 km', status: 'Ready · Nearest' },
  { id: 'hc3', name: 'HC-3 Bhawan Shrine', lat: 33.0305, lon: 74.9565, distance: '2.1 km', status: 'Staff ready' }
];

interface EmergencyState {
  active: boolean;
  name: string;
  hr: number;
  spo2: number;
  reason: string;
  countdown: number;
  dispatched: boolean;
}

interface TrekSafeContextType {
  trekkers: Trekker[];
  selectedTrekker: Trekker | null;
  completedTrekkers: CompletedTrekker[];
  lostPersons: LostPerson[];
  activeTab: 'pilgrim' | 'medical' | 'lost';
  medFilter: string;
  isSatelliteMode: boolean;
  isDark: boolean;
  emergencyAlert: EmergencyState;
  hardwareConnected: boolean;
  userLiveCoords: { lat: number | null; lon: number | null; accuracy: number | null; altitude: string | null };
  toastMessage: string | null;
  vitalsHistory: { hr: number[]; spo2: number[]; labels: string[] };
  setActiveTab: (tab: 'pilgrim' | 'medical' | 'lost') => void;
  setMedFilter: (filter: string) => void;
  setIsSatelliteMode: (sat: boolean | ((prev: boolean) => boolean)) => void;
  toggleTheme: () => void;
  selectTrekker: (id: number) => void;
  addTrekker: (t: Omit<Trekker, 'id' | 'status'>) => void;
  markCompleted: (id: number) => void;
  simulateFall: () => void;
  deployOxygen: (name: string) => void;
  triggerEmergency: (name: string, hr: number, spo2: number, reason: string) => void;
  cancelAlert: () => void;
  dispatchRescueNow: () => void;
  addLostPerson: (p: Omit<LostPerson, 'id'>) => void;
  removeLostPerson: (id: number) => void;
  setHardwareConnected: (c: boolean) => void;
  applyHardwarePayload: (payload: any) => void;
  updateUserLocation: (lat: number, lon: number, accuracy?: number) => void;
  showToast: (msg: string) => void;
}

const TrekSafeContext = createContext<TrekSafeContextType | null>(null);

const INITIAL_TREKKERS: Trekker[] = [
  { id: 0, name: 'You (This Device)', age: 'Self', hr: 76, spo2: 98, movement: 'Active GPS', status: 'green', lat: 33.0080, lon: 74.9430, isUser: true, medicalCondition: 'None (Healthy)', riskLevel: 'normal', routeIndex: 1, battery: 98, gpsStatus: 'Acquiring GPS...' },
  { id: 1, name: 'Ramesh Kumar', age: 68, hr: 88, spo2: 96, movement: 'Walking', status: 'green', lat: 33.0035, lon: 74.9405, medicalCondition: 'None (Healthy)', riskLevel: 'normal', routeIndex: 1, battery: 84 },
  { id: 2, name: 'Sunita Devi', age: 72, hr: 104, spo2: 91, movement: 'Climbing', status: 'amber', lat: 33.0185, lon: 74.9490, medicalCondition: 'Asthma (Hypoxia Risk)', riskLevel: 'high', routeIndex: 3, battery: 71 },
  { id: 3, name: 'Arvind Singh', age: 61, hr: 118, spo2: 93, movement: 'Walking', status: 'amber', lat: 33.0245, lon: 74.9525, medicalCondition: 'Hypertension (High BP)', riskLevel: 'med', routeIndex: 4, battery: 65 },
  { id: 4, name: 'Meena Patel', age: 75, hr: 78, spo2: 97, movement: 'Resting', status: 'green', lat: 33.0280, lon: 74.9540, medicalCondition: 'Cardiac History (CAD)', riskLevel: 'high', routeIndex: 5, battery: 92 },
  { id: 5, name: 'Gopal Rao', age: 69, hr: 92, spo2: 95, movement: 'Walking', status: 'green', lat: 32.9922, lon: 74.9315, medicalCondition: 'Diabetes Type-2', riskLevel: 'med', routeIndex: 0, battery: 78 },
];

const INITIAL_LOST: LostPerson[] = [
  { id: 101, name: 'Aarav Sharma', age: 8, type: 'child', lat: 33.0125, lon: 74.9450, status: 'red', dist: '1.4 km', batt: '62%', lastSeen: '14 min ago' },
  { id: 102, name: 'Kavita Joshi', age: 67, type: 'elder', lat: 33.0210, lon: 74.9510, status: 'amber', dist: '2.1 km', batt: '38%', lastSeen: '28 min ago' },
  { id: 103, name: 'Suresh Verma', age: 74, type: 'elder', lat: 32.9970, lon: 74.9360, status: 'green', dist: '0.8 km', batt: '85%', lastSeen: '4 min ago' },
];

export function TrekSafeProvider({ children }: { children: React.ReactNode }) {
  const [trekkers, setTrekkers] = useState<Trekker[]>(INITIAL_TREKKERS);
  const [selectedTrekker, setSelectedTrekker] = useState<Trekker | null>(INITIAL_TREKKERS[0]);
  const [completedTrekkers, setCompletedTrekkers] = useState<CompletedTrekker[]>([]);
  const [lostPersons, setLostPersons] = useState<LostPerson[]>(INITIAL_LOST);
  const [activeTab, setActiveTab] = useState<'pilgrim' | 'medical' | 'lost'>('pilgrim');
  const [medFilter, setMedFilter] = useState<string>('all');
  const [isSatelliteMode, setIsSatelliteMode] = useState<boolean>(true);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [hardwareConnected, setHardwareConnected] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userLiveCoords, setUserLiveCoords] = useState<{ lat: number | null; lon: number | null; accuracy: number | null; altitude: string | null }>({
    lat: null, lon: null, accuracy: null, altitude: null
  });

  const [vitalsHistory, setVitalsHistory] = useState<{ hr: number[]; spo2: number[]; labels: string[] }>({
    hr: [74, 75, 78, 80, 76, 75, 79, 82, 80, 76, 75, 76, 78, 77, 76, 75, 74, 76, 77, 76],
    spo2: [98, 98, 97, 98, 98, 99, 98, 97, 98, 98, 98, 97, 98, 98, 98, 99, 98, 98, 97, 98],
    labels: Array(20).fill('')
  });

  const [emergencyAlert, setEmergencyAlert] = useState<EmergencyState>({
    active: false,
    name: '',
    hr: 0,
    spo2: 0,
    reason: '',
    countdown: 30,
    dispatched: false
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('ts-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('ts-theme', 'light');
      }
      return next;
    });
  }, []);

  // Initialize theme from localStorage (default to light)
  useEffect(() => {
    const saved = localStorage.getItem('ts-theme');
    if (saved === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const isCalibratedRef = React.useRef<boolean>(false);

  // Geolocation for user's device
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, altitude, speed } = pos.coords;
        if (isCalibratedRef.current && accuracy > 30) {
          // Keep calibrated position instead of inaccurate desktop IP triangulation
          return;
        }

        setUserLiveCoords({
          lat: latitude,
          lon: longitude,
          accuracy: Math.round(accuracy),
          altitude: altitude ? `${Math.round(altitude)} m` : 'Local Ground'
        });

        setTrekkers(prev => prev.map(t => {
          if (t.isUser && !t.isLiveHw) {
            return {
              ...t,
              lat: latitude,
              lon: longitude,
              accuracy: Math.round(accuracy),
              gpsStatus: `Live (±${Math.round(accuracy)}m)`,
              movement: speed && speed > 0.5 ? `Moving (${(speed * 3.6).toFixed(1)} km/h)` : 'Stationary'
            };
          }
          return t;
        }));
      },
      (err) => console.warn('GPS Notice:', err.message),
      { enableHighAccuracy: true, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Simulation tick loop (movement along trail & vitals jitter)
  useEffect(() => {
    const interval = setInterval(() => {
      setTrekkers(prev => prev.map(t => {
        if (t.isUser && t.isLiveHw) return t;
        
        let newHr = t.hr;
        let newSpo2 = t.spo2;
        let newStatus = t.status;
        let newMovement = t.movement;
        let newLat = t.lat;
        let newLon = t.lon;
        let newRouteIndex = t.routeIndex || 0;
        let hasFinished = t.hasFinished;

        if (t.isUser) {
          newHr = Math.max(68, Math.min(105, t.hr + Math.floor(Math.random() * 5 - 2)));
          newSpo2 = Math.max(96, Math.min(100, t.spo2 + Math.floor(Math.random() * 3 - 1)));
          newStatus = 'green';
        } else {
          newHr = Math.max(60, Math.min(155, t.hr + Math.floor(Math.random() * 7 - 3)));
          newSpo2 = Math.max(84, Math.min(100, t.spo2 + Math.floor(Math.random() * 3 - 1)));

          if (t.movement && t.movement.includes('FALL')) {
            newStatus = 'red';
          } else {
            newStatus = (newHr > 125 && newSpo2 < 91) ? 'red' : (newHr > 105 || newSpo2 < 94) ? 'amber' : 'green';
          }

          // Advance along Vaishno Devi trail
          if (t.movement === 'Walking' || t.movement === 'Climbing') {
            const targetIndex = Math.min(VAISHNO_DEVI_TRACK.length - 1, newRouteIndex + 1);
            const targetCoord = VAISHNO_DEVI_TRACK[targetIndex];
            const stepRate = 0.08;
            newLat = parseFloat((t.lat + (targetCoord[0] - t.lat) * stepRate).toFixed(5));
            newLon = parseFloat((t.lon + (targetCoord[1] - t.lon) * stepRate).toFixed(5));

            const dist = Math.abs(newLat - targetCoord[0]) + Math.abs(newLon - targetCoord[1]);
            if (dist < 0.001) {
              newRouteIndex = targetIndex;
              if (newRouteIndex === VAISHNO_DEVI_TRACK.length - 1 && !hasFinished) {
                hasFinished = true;
                newMovement = '🎉 Finished Trek (Bhawan)';
                newStatus = 'green';
              }
            }
          }
        }

        return {
          ...t,
          hr: newHr,
          spo2: newSpo2,
          status: newStatus,
          movement: newMovement,
          lat: newLat,
          lon: newLon,
          routeIndex: newRouteIndex,
          hasFinished
        };
      }));
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  // Update selected trekker & vitals chart
  useEffect(() => {
    if (!selectedTrekker) return;
    const current = trekkers.find(t => t.id === selectedTrekker.id);
    if (current) {
      setSelectedTrekker(current);
      setVitalsHistory(prev => ({
        hr: [...prev.hr.slice(1), current.hr],
        spo2: [...prev.spo2.slice(1), current.spo2],
        labels: [...prev.labels.slice(1), new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })]
      }));
    }
  }, [trekkers]);

  // Emergency countdown timer
  useEffect(() => {
    if (!emergencyAlert.active || emergencyAlert.dispatched) return;
    const timer = setInterval(() => {
      setEmergencyAlert(prev => {
        if (prev.countdown <= 1) {
          clearInterval(timer);
          return { ...prev, countdown: 0, dispatched: true };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [emergencyAlert.active, emergencyAlert.dispatched]);

  const selectTrekker = useCallback((id: number) => {
    const t = trekkers.find(x => x.id === id);
    if (t) setSelectedTrekker(t);
  }, [trekkers]);

  const addTrekker = useCallback((data: Omit<Trekker, 'id' | 'status'>) => {
    const isHighRisk = data.medicalCondition.includes('Cardiac') || data.medicalCondition.includes('Asthma');
    const newTrekker: Trekker = {
      ...data,
      id: Date.now(),
      status: isHighRisk ? 'amber' : 'green',
      battery: 100,
      routeIndex: 0
    };
    setTrekkers(prev => [newTrekker, ...prev]);
    setSelectedTrekker(newTrekker);
    showToast(`➕ Registered ${data.name} with condition: ${data.medicalCondition}`);
  }, [showToast]);

  const markCompleted = useCallback((id: number) => {
    if (id === 0) {
      showToast('ℹ️ Your device is permanent in monitoring mode');
      return;
    }
    const t = trekkers.find(x => x.id === id);
    if (!t) return;
    setCompletedTrekkers(prev => [{ ...t, completedAt: new Date().toLocaleTimeString('en', { hour12: false }) }, ...prev]);
    setTrekkers(prev => prev.filter(x => x.id !== id));
    if (selectedTrekker?.id === id) {
      setSelectedTrekker(trekkers[0]);
    }
    showToast(`✅ ${t.name} marked completed`);
  }, [trekkers, selectedTrekker, showToast]);

  const triggerEmergency = useCallback((name: string, hr: number, spo2: number, reason: string) => {
    setEmergencyAlert({
      active: true,
      name,
      hr,
      spo2,
      reason,
      countdown: 30,
      dispatched: false
    });
  }, []);

  const simulateFall = useCallback(() => {
    const target = trekkers.find(t => !t.isUser && !t.movement.includes('FALL')) || trekkers[1];
    setTrekkers(prev => prev.map(t => t.id === target.id ? { ...t, movement: '⚠️ FALL DETECTED', hr: 138, spo2: 87, status: 'red' } : t));
    selectTrekker(target.id);
    triggerEmergency(target.name, 138, 87, 'MPU6050 6-Axis Accelerometer Impact: FALL DETECTED on Trail');
    showToast(`💥 Fall Event simulated for ${target.name}!`);
  }, [trekkers, selectTrekker, triggerEmergency, showToast]);

  const deployOxygen = useCallback((name: string) => {
    showToast(`🫁 Emergency Oxygen Concentrator dispatched for ${name} via HC-2 Medical Post`);
  }, [showToast]);

  const cancelAlert = useCallback(() => {
    setEmergencyAlert(prev => ({ ...prev, active: false, dispatched: false }));
    showToast('✅ Alert cancelled — pilgrim confirmed safe');
  }, [showToast]);

  const dispatchRescueNow = useCallback(() => {
    setEmergencyAlert(prev => ({ ...prev, countdown: 0, dispatched: true }));
    showToast('🚑 Rapid Response Rescue Team Dispatched from HC-2!');
  }, [showToast]);

  const addLostPerson = useCallback((data: Omit<LostPerson, 'id'>) => {
    const newPerson: LostPerson = {
      ...data,
      id: Date.now()
    };
    setLostPersons(prev => [newPerson, ...prev]);
    showToast(`➕ Added ${data.name} to Search & Rescue Radar`);
  }, [showToast]);

  const removeLostPerson = useCallback((id: number) => {
    setLostPersons(prev => prev.filter(p => p.id !== id));
    showToast('✅ Person removed from tracking');
  }, [showToast]);

  const applyHardwarePayload = useCallback((p: any) => {
    const hr = p.hr !== undefined ? parseInt(p.hr) : 76;
    const spo2 = p.spo2 !== undefined ? parseInt(p.spo2) : 98;
    let cleanMotion = p.mot !== undefined ? String(p.mot) : 'Walking';
    if (cleanMotion.includes('FALL')) cleanMotion = 'Motion Active (IMU)';
    const lat = p.lat !== undefined ? parseFloat(p.lat) : undefined;
    const lon = p.lon !== undefined ? parseFloat(p.lon) : undefined;
    const batt = p.batt !== undefined ? parseInt(p.batt) : 96;

    setTrekkers(prev => prev.map(t => {
      if (t.id === 0) {
        return {
          ...t,
          hr,
          spo2,
          movement: cleanMotion,
          lat: lat ?? t.lat,
          lon: lon ?? t.lon,
          isLiveHw: true,
          status: (hr > 125 || (spo2 > 0 && spo2 < 89)) ? 'amber' : 'green',
          battery: batt,
          gpsStatus: 'Live GPS (Serial Sync)'
        };
      }
      return t;
    }));

    setSelectedTrekker(prev => {
      if (!prev || prev.id === 0) {
        return {
          id: 0,
          name: 'You (This Device)',
          age: 'Self',
          hr,
          spo2,
          movement: cleanMotion,
          status: (hr > 125 || (spo2 > 0 && spo2 < 89)) ? 'amber' : 'green',
          lat: lat ?? (prev?.lat ?? 28.4089),
          lon: lon ?? (prev?.lon ?? 77.3178),
          isUser: true,
          isLiveHw: true,
          medicalCondition: 'None (Healthy)',
          riskLevel: 'normal',
          routeIndex: 0,
          battery: batt,
          gpsStatus: 'Live GPS (Serial Sync)'
        };
      }
      return prev;
    });

    if (lat !== undefined && lon !== undefined) {
      setUserLiveCoords({
        lat,
        lon,
        accuracy: 3,
        altitude: '215 m'
      });
    }

    setVitalsHistory(prev => ({
      hr: [...prev.hr.slice(1), hr],
      spo2: [...prev.spo2.slice(1), spo2],
      labels: [...prev.labels.slice(1), new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })]
    }));

    setHardwareConnected(true);
  }, []);

  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  const updateUserLocation = useCallback((lat: number, lon: number, accuracy: number = 2) => {
    setIsCalibrated(true);
    isCalibratedRef.current = true;
    setUserLiveCoords(prev => ({
      ...prev,
      lat,
      lon,
      accuracy: Math.round(accuracy)
    }));
    setTrekkers(prev => prev.map(t => {
      if (t.isUser) {
        return {
          ...t,
          lat,
          lon,
          accuracy: Math.round(accuracy),
          gpsStatus: `Calibrated Pinpoint (±${Math.round(accuracy)}m)`
        };
      }
      return t;
    }));
    showToast(`🎯 Device GPS Pinpoint: ${lat.toFixed(5)}°, ${lon.toFixed(5)}° (±${Math.round(accuracy)}m)`);
  }, [showToast]);

  return (
    <TrekSafeContext.Provider value={{
      trekkers,
      selectedTrekker,
      completedTrekkers,
      lostPersons,
      activeTab,
      medFilter,
      isSatelliteMode,
      isDark,
      emergencyAlert,
      hardwareConnected,
      userLiveCoords,
      toastMessage,
      vitalsHistory,
      setActiveTab,
      setMedFilter,
      setIsSatelliteMode,
      toggleTheme,
      selectTrekker,
      addTrekker,
      markCompleted,
      simulateFall,
      deployOxygen,
      triggerEmergency,
      cancelAlert,
      dispatchRescueNow,
      addLostPerson,
      removeLostPerson,
      setHardwareConnected,
      applyHardwarePayload,
      updateUserLocation,
      showToast
    }}>
      {children}
    </TrekSafeContext.Provider>
  );
}

export function useTrekSafe() {
  const context = useContext(TrekSafeContext);
  if (!context) throw new Error('useTrekSafe must be used within TrekSafeProvider');
  return context;
}
