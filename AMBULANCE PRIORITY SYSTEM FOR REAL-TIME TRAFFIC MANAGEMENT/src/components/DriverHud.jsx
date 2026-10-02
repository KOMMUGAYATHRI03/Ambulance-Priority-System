import React, { useState } from 'react';
import { Volume2, VolumeX, ShieldAlert, Navigation, Gauge, Zap, AlertCircle, Compass, Flame, Play, Pause, RotateCcw } from 'lucide-react';
import { audioService } from '../services/audioService';

export default function DriverHud({
  ambulance,
  nextJunction,
  onToggleSiren,
  onSetPriority,
  onResetSimulation,
  onStartSimulation,
  isSimulating
}) {
  const [sirenMode, setSirenMode] = useState('wail');

  const handleSirenClick = (mode) => {
    setSirenMode(mode);
    audioService.toggleSiren(true, mode);
    onToggleSiren(true);
  };

  const handleSirenStop = () => {
    audioService.toggleSiren(false);
    onToggleSiren(false);
  };

  // Recommended GLOSA speed calculation
  const recommendedSpeed = nextJunction?.preempted ? 55 : 48;

  return (
    <div className="space-y-6">
      {/* Cockpit Siren Status Top Bar */}
      <div className={`glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4 border ${
        ambulance.sirenActive ? 'siren-active-bar border-red-500/80' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${ambulance.sirenActive ? 'bg-red-500 text-white animate-bounce' : 'bg-slate-800 text-slate-400'}`}>
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="text-lg font-bold font-display text-white flex items-center gap-2">
              COCKPIT TELEMETRY & EM-DRIVE HUD
              <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                ambulance.priorityLevel === 'CODE 3' ? 'bg-red-500 text-white font-bold' : 'bg-amber-500 text-black'
              }`}>
                {ambulance.priorityLevel} CRITICAL
              </span>
            </div>
            <div className="text-xs text-slate-300">
              Vehicle ID: <span className="font-mono text-cyan-400 font-bold">{ambulance.id}</span> • GPS Lock: <span className="text-emerald-400 font-mono">FIXED (37.7749° N, 122.4194° W)</span>
            </div>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onStartSimulation}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
              isSimulating
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold'
            }`}
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {isSimulating ? 'PAUSE ROUTE' : 'START TRANSIT'}
          </button>

          <button
            onClick={onResetSimulation}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" /> RESET
          </button>
        </div>
      </div>

      {/* Main HUD Gauge Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Speed & GLOSA Advisor Gauge */}
        <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-cyan-400">
              <Gauge className="w-4 h-4" /> GLOSA SPEED ADVISORY
            </span>
            <span className="font-mono">OPTIMAL SIGNAL GLIDE</span>
          </div>

          <div className="my-4 text-center">
            <div className="text-6xl font-black font-display text-white tracking-tight">
              {ambulance.speed}
              <span className="text-xl font-normal text-slate-400 ml-2 font-mono">km/h</span>
            </div>
            
            {/* Target GLOSA speed prompt */}
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
              <Zap className="w-3.5 h-3.5" />
              RECOMMENDED TARGET: {recommendedSpeed} km/h FOR GREEN WAVE
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>0 km/h</span>
              <span>Cruise Speed</span>
              <span>100 km/h</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${(ambulance.speed / 90) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Next Signal Approach Cockpit Display */}
        <div className="glass-panel p-6 flex flex-col justify-between border-cyan-500/30">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-white">
              <Navigation className="w-4 h-4 text-emerald-400" /> NEXT INTERSECTION SIGNAL
            </span>
            <span className="font-mono text-emerald-400">PREEMPTION ENGINE</span>
          </div>

          {nextJunction ? (
            <div className="my-2 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-display text-white">
                    {nextJunction.name}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Distance: <span className="text-cyan-400 font-bold">{Math.round(nextJunction.distance || 180)} meters</span>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl flex flex-col items-center justify-center min-w-[80px] ${
                  nextJunction.preempted
                    ? 'signal-green signal-pulse-green text-slate-950 font-black'
                    : nextJunction.currentSignal === 'RED'
                    ? 'signal-red text-white'
                    : 'signal-yellow text-slate-950'
                }`}>
                  <span className="text-xs font-mono font-bold">SIGNAL</span>
                  <span className="text-xl font-black font-display">
                    {nextJunction.preempted ? 'GREEN' : nextJunction.currentSignal}
                  </span>
                </div>
              </div>

              {/* Preemption Status Banner */}
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                nextJunction.preempted
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              }`}>
                <Zap className="w-4 h-4 shrink-0" />
                {nextJunction.preempted
                  ? 'GEOFENCE CLEARED: GREEN CORRIDOR ACTIVE'
                  : 'APPROACHING GEOFENCE TRIGGER (IN 80m)'}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              All Intersections Cleared. Final approach to hospital.
            </div>
          )}

          <div className="text-[11px] text-slate-400 font-mono flex justify-between pt-2 border-t border-slate-800">
            <span>Preemption Radius: 250m</span>
            <span>Signal Hold: {nextJunction?.countdown || 0}s</span>
          </div>
        </div>

        {/* In-Cabin Audio Siren Synthesizer Panel */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-red-400">
              <Volume2 className="w-4 h-4" /> SIREN AUDIO SYNTHESIZER
            </span>
            <span className="font-mono text-slate-400">WEB AUDIO API</span>
          </div>

          <div className="space-y-3 my-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSirenClick('wail')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all border ${
                  ambulance.sirenActive && sirenMode === 'wail'
                    ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                WAIL (HIGH)
              </button>

              <button
                onClick={() => handleSirenClick('yelp')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all border ${
                  ambulance.sirenActive && sirenMode === 'yelp'
                    ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                YELP (FAST)
              </button>

              <button
                onClick={() => handleSirenClick('hi-lo')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all border ${
                  ambulance.sirenActive && sirenMode === 'hi-lo'
                    ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                HI-LO
              </button>
            </div>

            <button
              onClick={handleSirenStop}
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                !ambulance.sirenActive
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-slate-900 text-red-400 border-red-500/40 hover:bg-slate-800'
              }`}
            >
              <VolumeX className="w-4 h-4" />
              MUTE SIREN AUDIO
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono text-center">
            {ambulance.sirenActive ? `🔊 Siren Output: ${sirenMode.toUpperCase()} MODE ACTIVE` : '🔇 Siren Muted'}
          </div>
        </div>
      </div>

      {/* Emergency Code Selection */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-300 font-medium">
          EMERGENCY PRIORITY LEVEL SELECTOR:
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSetPriority('CODE 3')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
              ambulance.priorityLevel === 'CODE 3'
                ? 'bg-red-500 text-white border-red-400 shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            CODE 3 (CRITICAL PREEMPTION)
          </button>
          <button
            onClick={() => onSetPriority('CODE 2')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
              ambulance.priorityLevel === 'CODE 2'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            CODE 2 (URGENT TRANSIT)
          </button>
          <button
            onClick={() => onSetPriority('CODE 1')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
              ambulance.priorityLevel === 'CODE 1'
                ? 'bg-blue-500 text-white border-blue-400'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            CODE 1 (STANDARD NAV)
          </button>
        </div>
      </div>
    </div>
  );
}
