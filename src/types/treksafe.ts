export type StatusColor = 'green' | 'amber' | 'red';
export type RiskLevel = 'normal' | 'med' | 'high';

export interface Trekker {
  id: number;
  name: string;
  age: number | 'Self';
  hr: number;
  spo2: number;
  movement: string;
  status: StatusColor;
  lat: number;
  lon: number;
  medicalCondition: string;
  riskLevel: RiskLevel;
  routeIndex?: number;
  isUser?: boolean;
  isLiveHw?: boolean;
  accuracy?: number | null;
  gpsStatus?: string;
  hasFinished?: boolean;
  battery?: number;
}

export interface LostPerson {
  id: number;
  name: string;
  age: number;
  type: 'child' | 'elder' | 'infirm';
  lat: number;
  lon: number;
  status: StatusColor;
  dist: string;
  batt: string;
  lastSeen: string;
}

export interface HelpCenter {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance?: string;
  status?: string;
}

export interface CompletedTrekker extends Trekker {
  completedAt: string;
}
