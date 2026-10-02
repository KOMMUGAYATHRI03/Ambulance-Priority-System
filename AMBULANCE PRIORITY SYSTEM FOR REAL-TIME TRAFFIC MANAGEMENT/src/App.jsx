import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Shield,
  Zap,
  Radio,
  Navigation,
  Heart,
  BarChart3,
  Flame,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';

import CityMap from './components/CityMap';
import TmcDashboard from './components/TmcDashboard';
import DriverHud from './components/DriverHud';
import HospitalErDashboard from './components/HospitalErDashboard';
import AnalyticsPanel from './components/AnalyticsPanel';
import { audioService } from './services/audioService';
import {
  syncAmbulanceTelemetryToFirebase,
  syncJunctionStatesToFirebase,
  firebaseConfig
} from './services/firebaseService';

// Default Route Waypoints (Depot 1 ➔ J-1 ➔ J-2 ➔ J-3 ➔ J-4 ➔ City General ER)
const ROUTE_WAYPOINTS = [
  { x: 100, y: 150 }, // Depot
  { x: 220, y: 150 }, // Junction 1
  { x: 460, y: 150 }, // Junction 2
  { x: 460, y: 350 }, // Junction 3
  { x: 460, y: 550 }, // Junction 4
  { x: 680, y: 550 }  // Hospital ER
];

const INITIAL_JUNCTIONS = [
  { id: 1, name: 'Junction 1 (Metro North)', x: 220, y: 150, currentSignal: 'RED', countdown: 12, preempted: false, geofenceRadius: 90, queueCount: 14, density: 68 },
  { id: 2, name: 'Junction 2 (Central Ave)', x: 460, y: 150, currentSignal: 'YELLOW', countdown: 3, preempted: false, geofenceRadius: 90, queueCount: 22, density: 84 },
  { id: 3, name: 'Junction 3 (Broadway Cross)', x: 460, y: 350, currentSignal: 'RED', countdown: 18, preempted: false, geofenceRadius: 90, queueCount: 18, density: 72 },
  { id: 4, name: 'Junction 4 (Hospital Way)', x: 460, y: 550, currentSignal: 'GREEN', countdown: 24, preempted: false, geofenceRadius: 90, queueCount: 8, density: 35 },
  { id: 5, name: 'Junction 5 (East Parkway)', x: 680, y: 150, currentSignal: 'RED', countdown: 15, preempted: false, geofenceRadius: 90, queueCount: 11, density: 45 },
  { id: 6, name: 'Junction 6 (South Loop)', x: 220, y: 350, currentSignal: 'GREEN', countdown: 20, preempted: false, geofenceRadius: 90, queueCount: 16, density: 55 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('simulation');
  const [junctions, setJunctions] = useState(INITIAL_JUNCTIONS);
  const [selectedJunction, setSelectedJunction] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);

  // Ambulance Telemetry State
  const [ambulance, setAmbulance] = useState({
    id: 'AMB-101',
    x: 100,
    y: 150,
    waypointIndex: 0,
    speed: 0,
    targetSpeed: 55,
    sirenActive: false,
    priorityLevel: 'CODE 3',
    geofenceTriggered: false,
    status: 'DEPOT STANDBY',
    etaSeconds: 140
  });

  // Patient Vitals State
  const [patient, setPatient] = useState({
    name: 'John Doe',
    age: 58,
    gender: 'Male',
    condition: 'Acute STEMI / Chest Pain',
    heartRate: 104,
    spo2: 97,
    bp: '138/88'
  });

  // Live Audit Event Stream
  const [eventLogs, setEventLogs] = useState([
    { time: '18:14:00', type: 'FIREBASE', message: `Connected to Firebase DB: ${firebaseConfig.projectId}` },
    { time: '18:14:05', type: 'INFO', message: 'Depot AMB-101 registered for Code 3 emergency transit.' }
  ]);

  const addLog = (type, message) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setEventLogs(prev => [{ time, type, message }, ...prev.slice(0, 19)]);
  };

  // Toggle Signal Preemption for a Junction
  const handleTogglePreemption = (junctionId) => {
    setJunctions(prev => {
      const updated = prev.map(j => {
        if (j.id === junctionId) {
          const newState = !j.preempted;
          if (newState) {
            audioService.playPreemptionChime();
            addLog('PREEMPT', `MANUAL OVERRIDE: ${j.name} GREEN CORRIDOR ENGAGED.`);
          } else {
            addLog('INFO', `Manual Preemption released for ${j.name}. Normal cycle restored.`);
          }
          return { ...j, preempted: newState, countdown: newState ? 35 : 15 };
        }
        return j;
      });
      syncJunctionStatesToFirebase(updated);
      return updated;
    });
  };

  // Signal Countdown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setJunctions(prev =>
        prev.map(j => {
          if (j.preempted) {
            if (j.countdown > 1) return { ...j, countdown: j.countdown - 1 };
            addLog('INFO', `Green Corridor hold expired for ${j.name}. Resetting signal.`);
            return { ...j, preempted: false, currentSignal: 'YELLOW', countdown: 4 };
          }
          if (j.countdown > 1) {
            return { ...j, countdown: j.countdown - 1 };
          } else {
            let nextSig = j.currentSignal === 'RED' ? 'GREEN' : j.currentSignal === 'GREEN' ? 'YELLOW' : 'RED';
            let nextTimer = nextSig === 'GREEN' ? 20 : nextSig === 'YELLOW' ? 4 : 18;
            return { ...j, currentSignal: nextSig, countdown: nextTimer };
          }
        })
      );
    }, 1000 / simSpeed);

    return () => clearInterval(interval);
  }, [simSpeed]);

  // Ambulance Movement & Geofence Sync Loop
  useEffect(() => {
    if (!isSimulating) return;

    const moveInterval = setInterval(() => {
      setAmbulance(prev => {
        const currentTarget = ROUTE_WAYPOINTS[prev.waypointIndex + 1];
        if (!currentTarget) {
          setIsSimulating(false);
          audioService.playPreemptionChime();
          addLog('ALERT', 'AMB-101 HAS ARRIVED AT CITY GENERAL ER TRAUMA BAY.');
          const arrived = { ...prev, speed: 0, status: 'ARRIVED AT ER', etaSeconds: 0 };
          syncAmbulanceTelemetryToFirebase(arrived);
          return arrived;
        }

        const dx = currentTarget.x - prev.x;
        const dy = currentTarget.y - prev.y;
        const distance = Math.hypot(dx, dy);
        const moveStep = 3.5 * simSpeed;

        if (distance < moveStep) {
          const nextIndex = prev.waypointIndex + 1;
          const updated = { ...prev, x: currentTarget.x, y: currentTarget.y, waypointIndex: nextIndex };
          syncAmbulanceTelemetryToFirebase(updated);
          return updated;
        } else {
          const angle = Math.atan2(dy, dx);
          const newX = prev.x + Math.cos(angle) * moveStep;
          const newY = prev.y + Math.sin(angle) * moveStep;

          junctions.forEach(j => {
            const jDist = Math.hypot(j.x - newX, j.y - newY);
            if (jDist <= j.geofenceRadius && !j.preempted) {
              handleTogglePreemption(j.id);
              addLog('PREEMPT', `AUTOMATIC GEOFENCE TRIGGER: AMB-101 approaching ${j.name}. Dynamic Green Corridor synced to Firebase.`);
            }
          });

          const updatedAmb = {
            ...prev,
            x: newX,
            y: newY,
            speed: Math.round(48 + Math.random() * 8),
            status: 'EN ROUTE (GREEN WAVE)',
            etaSeconds: Math.max(0, Math.round((distance + (ROUTE_WAYPOINTS.length - prev.waypointIndex - 2) * 200) / (moveStep * 2)))
          };
          syncAmbulanceTelemetryToFirebase(updatedAmb);
          return updatedAmb;
        }
      });
    }, 100);

    return () => clearInterval(moveInterval);
  }, [isSimulating, junctions, simSpeed]);

  const handleStartSim = () => {
    if (!isSimulating) {
      setIsSimulating(true);
      audioService.toggleSiren(true, 'wail');
      const activeState = { ...ambulance, sirenActive: true, status: 'EN ROUTE' };
      setAmbulance(activeState);
      syncAmbulanceTelemetryToFirebase(activeState);
      addLog('ALERT', 'AMB-101 Emergency dispatch initiated. Telemetry syncing to Firebase DB.');
    } else {
      setIsSimulating(false);
      audioService.toggleSiren(false);
      const pausedState = { ...ambulance, sirenActive: false, status: 'PAUSED' };
      setAmbulance(pausedState);
      syncAmbulanceTelemetryToFirebase(pausedState);
    }
  };

  const handleResetSim = () => {
    setIsSimulating(false);
    audioService.toggleSiren(false);
    setJunctions(INITIAL_JUNCTIONS);
    const resetAmb = {
      id: 'AMB-101',
      x: ROUTE_WAYPOINTS[0].x,
      y: ROUTE_WAYPOINTS[0].y,
      waypointIndex: 0,
      speed: 0,
      targetSpeed: 55,
      sirenActive: false,
      priorityLevel: 'CODE 3',
      geofenceTriggered: false,
      status: 'DEPOT STANDBY',
      etaSeconds: 140
    };
    setAmbulance(resetAmb);
    syncAmbulanceTelemetryToFirebase(resetAmb);
    syncJunctionStatesToFirebase(INITIAL_JUNCTIONS);
    addLog('SYSTEM', 'Simulation environment reset. Firebase DB synced.');
  };

  const nextJunction = junctions.find(j => {
    const dist = Math.hypot(j.x - ambulance.x, j.y - ambulance.y);
    return dist < 300 && ambulance.x <= j.x;
  });

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="sticky top-0 z-50 glass-panel-glow rounded-none border-x-0 border-t-0 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-red-600 to-rose-400 shadow-lg shadow-red-500/30 text-white">
            <Zap className="w-6 h-6 fill-current animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-white tracking-wide flex items-center gap-2">
              GREEN-CORRIDOR AI 
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                FIREBASE LIVE DB
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Project: <strong className="text-cyan-400 font-mono">{firebaseConfig.projectId}</strong> • Automated Traffic Signal Preemption
            </p>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'simulation'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" /> LIVE CITY MAP
          </button>

          <button
            onClick={() => setActiveTab('tmc')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'tmc'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> TMC COMMAND
          </button>

          <button
            onClick={() => setActiveTab('driver')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'driver'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> DRIVER HUD
          </button>

          <button
            onClick={() => setActiveTab('er')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'er'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" /> HOSPITAL ER
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> ANALYTICS
          </button>
        </nav>

        {/* Global Toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-500 px-1">SPEED:</span>
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-2 py-0.5 rounded font-bold ${
                  simSpeed === s ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={handleStartSim}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {isSimulating ? 'PAUSE ROUTE' : 'DISPATCH AMBULANCE'}
          </button>
        </div>
      </header>

      {/* Main Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CityMap
                  junctions={junctions}
                  ambulance={ambulance}
                  routes={ROUTE_WAYPOINTS}
                  selectedJunction={selectedJunction}
                  onSelectJunction={setSelectedJunction}
                  onTogglePreemption={handleTogglePreemption}
                />
              </div>

              {/* Side Simulation Control Panel */}
              <div className="space-y-4">
                <div className="glass-panel p-5 space-y-4 border-cyan-500/20">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white font-display flex items-center gap-2">
                      🔥 FIREBASE REALTIME TELEMETRY
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                      CONNECTED
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Firebase DB Project:</span>
                      <span className="font-mono font-bold text-cyan-400 text-[11px]">{firebaseConfig.projectId}</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Emergency Priority:</span>
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold font-mono">
                        {ambulance.priorityLevel} CRITICAL
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Current Velocity:</span>
                      <span className="font-mono font-bold text-cyan-400">{ambulance.speed} km/h</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Hospital ETA:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {ambulance.etaSeconds} sec
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={handleResetSim}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> RESET SIMULATION
                    </button>
                  </div>
                </div>

                {/* Audit Stream */}
                <div className="glass-panel p-4 text-xs font-mono max-h-56 overflow-y-auto space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 font-sans border-b border-slate-800 pb-1 mb-2">
                    LIVE FIREBASE LOG STREAM
                  </div>
                  {eventLogs.slice(0, 6).map((log, i) => (
                    <div key={i} className="text-[11px] leading-snug">
                      <span className="text-cyan-400">[{log.time}]</span>{' '}
                      <span className="text-slate-300">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tmc' && (
          <TmcDashboard
            junctions={junctions}
            ambulance={ambulance}
            onTogglePreemption={handleTogglePreemption}
            eventLogs={eventLogs}
          />
        )}

        {activeTab === 'driver' && (
          <DriverHud
            ambulance={ambulance}
            nextJunction={nextJunction}
            onToggleSiren={active => setAmbulance(prev => ({ ...prev, sirenActive: active }))}
            onSetPriority={level => setAmbulance(prev => ({ ...prev, priorityLevel: level }))}
            onResetSimulation={handleResetSim}
            onStartSimulation={handleStartSim}
            isSimulating={isSimulating}
          />
        )}

        {activeTab === 'er' && (
          <HospitalErDashboard ambulance={ambulance} patient={patient} />
        )}

        {activeTab === 'analytics' && <AnalyticsPanel />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500 font-mono">
        Ambulance Priority System • Connected to Firebase DB: ambulance-detection-b47d5
      </footer>
    </div>
  );
}
