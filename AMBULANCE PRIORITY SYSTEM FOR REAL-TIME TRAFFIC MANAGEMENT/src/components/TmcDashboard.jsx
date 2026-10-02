import React from 'react';
import { Shield, Zap, AlertTriangle, Cpu, Radio, CheckCircle, RefreshCw, Car, Flame, ArrowRight } from 'lucide-react';

export default function TmcDashboard({
  junctions,
  ambulance,
  onTogglePreemption,
  onManualOverride,
  eventLogs
}) {
  const activeCorridors = junctions.filter(j => j.preempted);

  return (
    <div className="space-y-6">
      {/* TMC Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">TOTAL JUNCTIONS</div>
            <div className="text-2xl font-bold font-display text-white mt-1">6 Nodes</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 100% Online
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 text-cyan-400 border border-slate-700">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">ACTIVE GREEN CORRIDORS</div>
            <div className="text-2xl font-bold font-display text-emerald-400 mt-1">
              {activeCorridors.length} Preemption{activeCorridors.length !== 1 ? 's' : ''}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Code 3 Priority Active
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 animate-pulse">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">AMBULANCE IN-TRANSIT</div>
            <div className="text-2xl font-bold font-display text-white mt-1">
              {ambulance?.id || 'AMB-101'}
            </div>
            <div className="text-[11px] text-cyan-400 mt-1 font-mono">
              {ambulance?.speed || 0} km/h • ETA: {ambulance?.etaSeconds || 0}s
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 text-red-400 border border-slate-700">
            <Radio className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">RESP. TIME SAVED</div>
            <div className="text-2xl font-bold font-display text-emerald-400 mt-1">
              - 4m 18s
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
              43.8% Efficiency Boost
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 text-emerald-400 border border-slate-700">
            <Shield className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Active Corridor Emergency Alert Banner */}
      {activeCorridors.length > 0 && (
        <div className="glass-panel-alert p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-red-500/20 text-red-500 animate-ping">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-red-400 font-display flex items-center gap-2">
                EMERGENCY GREEN CORRIDOR ENGAGED
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 font-mono">
                  AUTOMATED PREEMPTION
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Ambulance <span className="font-semibold text-white">{ambulance?.id}</span> cleared for rapid transit through{' '}
                <span className="text-emerald-400 font-semibold">
                  {activeCorridors.map(c => c.name).join(', ')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right text-xs mr-2 font-mono hidden md:block">
              <div className="text-slate-400">Preemption Timeout</div>
              <div className="text-emerald-400 font-bold">{activeCorridors[0]?.countdown}s Remaining</div>
            </div>
          </div>
        </div>
      )}

      {/* Junction Control Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
            <Car className="w-4 h-4 text-cyan-400" /> REAL-TIME INTERSECTION SIGNAL MATRIX
          </h3>
          <span className="text-xs text-slate-400">
            Click any junction to manually toggle green corridor override
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {junctions.map(j => {
            const isPreempted = j.preempted;
            return (
              <div
                key={j.id}
                className={`glass-panel p-4 transition-all duration-300 border ${
                  isPreempted
                    ? 'border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_20px_rgba(0,230,118,0.15)]'
                    : 'hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div>
                    <div className="font-bold text-sm text-slate-100 font-display flex items-center gap-2">
                      {j.name}
                      {isPreempted && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
                          PREEMPTED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Coordinates: <span className="font-mono text-slate-300">[{j.x}, {j.y}]</span>
                    </div>
                  </div>

                  {/* Signal Light Indicator */}
                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                    <span
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                        isPreempted || j.currentSignal === 'GREEN'
                          ? 'signal-green signal-pulse-green'
                          : j.currentSignal === 'YELLOW'
                          ? 'signal-yellow'
                          : 'signal-red'
                      }`}
                    ></span>
                    <span className="text-xs font-mono font-bold text-white">
                      {isPreempted ? 'GREEN' : j.currentSignal} ({j.countdown}s)
                    </span>
                  </div>
                </div>

                {/* Queue & Traffic Density Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">TRAFFIC DENSITY</span>
                    <span className="font-mono font-bold text-slate-200">{j.density}%</span>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          j.density > 75
                            ? 'bg-red-500'
                            : j.density > 45
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${j.density}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">QUEUE LENGTH</span>
                    <span className="font-mono font-bold text-slate-200">{j.queueCount} Vehicles</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Avg Wait: {Math.round(j.queueCount * 1.8)}s</span>
                  </div>
                </div>

                {/* Manual Signal Override Button */}
                <button
                  onClick={() => onTogglePreemption(j.id)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isPreempted
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {isPreempted ? 'DISABLE PREEMPTION OVERRIDE' : 'FORCE GREEN CORRIDOR'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* TMC Event Audit Log */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" /> SYSTEM AUDIT LOG & EVENT STREAM
          </h3>
          <span className="text-xs text-slate-400 font-mono">Live Sync Engine</span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {eventLogs && eventLogs.length > 0 ? (
            eventLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-start gap-3 text-xs bg-slate-900/50 p-2 rounded border border-slate-800/60 font-mono"
              >
                <span className="text-cyan-400 shrink-0">{log.time}</span>
                <span
                  className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    log.type === 'PREEMPT'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : log.type === 'ALERT'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {log.type}
                </span>
                <span className="text-slate-200">{log.message}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 italic py-4 text-center">
              No audit logs recorded yet. Initiate ambulance movement to view live events.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
