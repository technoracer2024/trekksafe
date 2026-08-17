# 🏔️ TrekSafe — Every Pilgrim Comes Home

> **Intelligent Real-Time Health Telemetry & Autonomous Emergency Dispatch for Himalayan Pilgrimage Routes.**

![TrekSafe Banner](https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80)

---

## 🌟 Overview

Over 60 million devotees trek Himalayan pilgrimage corridors (such as Vaishno Devi, Amarnath, Kedarnath, and Hemkund Sahib) annually. High altitude, extreme terrain, and sudden silent hypoxia lead to hundreds of preventable fatalities every season.

**TrekSafe** is an end-to-end telemetry platform combining:
- **Biometric Smart Wristbands**: Real-time Heart Rate (BPM), Blood Oxygen (SpO₂), and 6-Axis IMU Fall Detection (MAX30102 + MPU6050).
- **Long-Range LoRa Mesh**: Sub-GHz RF transmission achieving 15+ km line-of-sight range with zero cellular or internet dependence.
- **Ultra-HD Satellite Command Center**: Multi-layer Leaflet satellite mapping (Google Hybrid Satellite + Esri World Imagery + Carto Topographic).
- **Automated Clinical Triage**: Instant hypoxia threshold detection and 30-second automated rescue dispatch to nearest Health Center outposts.
- **Web Serial Hardware Prototype Bridge**: Direct USB serial streaming at 115200 baud from physical ESP8266 / ESP32 hardware.

---

## 🧭 Multi-Page Platform Architecture

- **` / ` (Command Dashboard)**: Real-time telemetry showcase with Pilgrim Monitor, High-Risk Medical Triage console, and Lost Person Radar.
- **` /mission `**: Vision, zero delayed discovery goals, and 2026–2028 national pilgrimage corridor roadmap.
- **` /problem `**: Deep-dive analysis on silent hypoxia, 400+ annual deaths, and cellular dead zones.
- **` /how-it-works `**: 4-Stage Operational Rescue Pipeline from biometric wristband to 30-second medic dispatch.
- **` /technology `**: Hardware specifications, sensor pinouts, LoRa mesh topology, and MCU power budgets.
- **` /pricing `**: ₹50/day pilgrim rental, shrine board turnkey corridor pilots, and NDRF disaster response kits.

---

## ⚡ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI & Styling**: React 18, Tailwind CSS v3.4, Lucide Icons
- **Mapping**: Leaflet, Google Hybrid Satellite, Esri World Imagery
- **Telemetry Charts**: Chart.js & React-Chartjs-2
- **Hardware Integration**: Web Serial API (`navigator.serial`) @ 115200 baud
- **State Management**: React Context API

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/treksafe.git
cd treksafe

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

---

## 🛰️ Production Deployment (Vercel)

Deploy in one click using the Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

Or connect this GitHub repository directly to [Vercel Dashboard](https://vercel.com/new).

---

## 📄 License

MIT License © 2026 TrekSafe Autonomous Mesh Network.
