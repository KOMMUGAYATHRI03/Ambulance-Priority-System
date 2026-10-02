import React from 'react';
import { Cpu, Wifi, Radio, Zap, AlertTriangle, ShieldCheck, Clock, Navigation, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function IotDashboard({ iotStatus }) {
  const isDetected = iotStatus?.ambulance_detected;
  const direction = iotStatus?.direction || 'NORTH';
  const confidence = iotStatus?.confidence || 0.0;
  const trafficMode = isDetected ? 'PRIORITY PREEMPTION MODE' : 'NORMAL CYCLIC MODE';
  const activeGreen = isDetected ? `JUNCTION ${direction} GREEN` : 'CYCLIC SIGNAL PHASE';
  const esp32Status = iotStatus?.esp32_status || 'ONLINE (ESP32-WROOM-32)';
  const timestamp = iotStatus?.timestamp || new Date().toLocaleString();

  return (
    <div className="space-y-6">
      {/* IoT Status Header Banner */}
      <div className={`glass-panel p-6 border transition-all ${
        isDetected ? 'glass-panel-alert border-red-500/50' : 'border-emerald-500/30'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${
              isDetected ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {isDetected ? <AlertOctagon className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
            </div>
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                BTECH PROJECT • IOT SYSTEM STATUS MONITOR
              </div>
              <div className="text-2xl font-bold font-display text-white mt-0.5">
                {isDetected ? '🚨 EMERGENCY VEHICLE INBOUND' : '🟢 NORMAL TRAFFIC SURVEILLANCE'}
              </div>
              <div className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                <span>Firebase DB: <strong className="text-cyan-400 font-mono">ambulance-detection-b47d5</strong></span>
                <span>•</span>
                <span>ESP32: <strong className="text-emerald-400 font-mono">{esp32Status}</strong></span>
              </div>
            </div>
          </div>

          <div className="glass-panel px-5 py-3 text-right bg-slate-900/80 border-slate-700 min-w-[200px]">
            <div className="text-[10px] text-slate-400 font-mono uppercase">LAST SYNC TIMESTAMP</div>
            <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">{timestamp}</div>
          </div>
        </div>
      </div>

      {/* 7 Required Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Ambulance Detection Status */}
        <div className={`glass-panel p-5 border ${isDetected ? 'border-red-500/40 bg-red-950/20' : 'border-slate-800'}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-white">
              <Radio className="w-4 h-4 text-cyan-400" /> 1. AMBULANCE STATUS
            </span>
            <span className="font-mono text-slate-400">YOLOv8 AI</span>
          </div>
          <div className="my-3">
            <div className={`text-2xl font-black font-display ${isDetected ? 'text-red-400' : 'text-emerald-400'}`}>
              {isDetected ? 'AMBULANCE DETECTED' : 'NOT DETECTED'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {isDetected ? 'Emergency priority active' : 'Scanning junction approaches...'}
            </div>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
            <div className={`h-full ${isDetected ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Card 2: Ambulance Direction */}
        <div className="glass-panel p-5 border-cyan-500/30">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-white">
              <Navigation className="w-4 h-4 text-cyan-400" /> 2. AMBULANCE DIRECTION
            </span>
            <span className="font-mono text-cyan-400">SECTOR RADAR</span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-display text-cyan-400 font-mono">
              {direction}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Approaching Junction Sector <strong className="text-white">{direction}</strong>
            </div>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800">
            <span className={direction === 'NORTH' ? 'text-emerald-400 font-bold' : ''}>NORTH</span>
            <span className={direction === 'EAST' ? 'text-emerald-400 font-bold' : ''}>EAST</span>
            <span className={direction === 'SOUTH' ? 'text-emerald-400 font-bold' : ''}>SOUTH</span>
            <span className={direction === 'WEST' ? 'text-emerald-400 font-bold' : ''}>WEST</span>
          </div>
        </div>

        {/* Card 3: Detection Confidence */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-white">
              <Zap className="w-4 h-4 text-emerald-400" /> 3. DETECTION CONFIDENCE
            </span>
            <span className="font-mono text-emerald-400">YOLOv8 MODEL</span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-display text-emerald-400 font-mono">
              {confidence.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Neural network accuracy score
            </div>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full" style={{ width: `${Math.max(10, confidence)}%` }}></div>
          </div>
        </div>

        {/* Card 4: Current Traffic Mode */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-white">
              <Cpu className="w-4 h-4 text-amber-400" /> 4. TRAFFIC CONTROL MODE
            </span>
            <span className="font-mono text-slate-400">ALGORITHM</span>
          </div>
          <div className="my-3">
            <div className={`text-xl font-bold font-display ${isDetected ? 'text-amber-400' : 'text-slate-200'}`}>
              {trafficMode}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {isDetected ? 'Green wave override engaged' : 'Standard timed traffic light cycle'}
            </div>
          </div>
        </div>

        {/* Card 5: Active Green Signal */}
        <div className="glass-panel p-5 border-emerald-500/30">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 5. ACTIVE GREEN SIGNAL
            </span>
            <span className="font-mono text-emerald-400">SIGNAL RELAY</span>
          </div>
          <div className="my-3">
            <div className="text-xl font-bold font-display text-emerald-400 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full signal-green signal-pulse-green inline-block"></span>
              {activeGreen}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Cross-traffic locked on RED for safety
            </div>
          </div>
        </div>

        {/* Card 6: ESP32 Connection Status */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-white">
              <Wifi className="w-4 h-4 text-cyan-400" /> 6. ESP32 HARDWARE STATUS
            </span>
            <span className="font-mono text-emerald-400">HARDWARE LINK</span>
          </div>
          <div className="my-3">
            <div className="text-lg font-bold font-display text-white font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
              {esp32Status}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              IoT Microcontroller ready for relay control
            </div>
          </div>
        </div>
      </div>

      {/* Summary Footer Box */}
      <div className="glass-panel p-4 text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-2 font-mono border-slate-800">
        <div>
          7. Detection Timestamp: <span className="text-white font-bold">{timestamp}</span>
        </div>
        <div className="text-emerald-400">
          🔥 Synced Live with Firebase Realtime Database
        </div>
      </div>
    </div>
  );
}
