import React, { useEffect, useRef } from 'react';
import { Heart, Activity, Thermometer, Droplet, Clock, ShieldCheck, UserCheck, Stethoscope, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function HospitalErDashboard({ ambulance, patient }) {
  const ecgCanvasRef = useRef(null);

  // Animated ECG Waveform Canvas
  useEffect(() => {
    const canvas = ecgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let step = 0;

    const drawEcg = () => {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 15) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // ECG Line
      ctx.strokeStyle = '#00E676';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00E676';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      const centerY = canvas.height / 2;

      for (let x = 0; x < canvas.width; x++) {
        const offset = (x + step) % 120;
        let y = centerY;

        if (offset > 40 && offset < 48) {
          y = centerY - 6; // P wave
        } else if (offset >= 55 && offset < 58) {
          y = centerY + 8; // Q wave
        } else if (offset >= 58 && offset < 64) {
          y = centerY - 45; // R spike
        } else if (offset >= 64 && offset < 68) {
          y = centerY + 18; // S wave
        } else if (offset >= 80 && offset < 92) {
          y = centerY - 12; // T wave
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      step += 3;
      animId = requestAnimationFrame(drawEcg);
    };

    drawEcg();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top ER Intake Header */}
      <div className="glass-panel p-6 border-red-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/30 animate-pulse">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs text-rose-400 font-bold uppercase tracking-wider">
              INCOMING CRITICAL TRAUMA PATIENT INBOUND
            </div>
            <div className="text-2xl font-bold font-display text-white mt-0.5">
              CITY GENERAL HOSPITAL • ER TRAUMA BAY 02
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span>Ambulance: <strong className="text-white">{ambulance.id}</strong></span>
              <span>•</span>
              <span>Priority: <strong className="text-red-400">{ambulance.priorityLevel}</strong></span>
              <span>•</span>
              <span>Trauma Team: <strong className="text-emerald-400">NOTIFIED & STANDING BY</strong></span>
            </div>
          </div>
        </div>

        {/* Live Countdown ETA Card */}
        <div className="glass-panel p-4 bg-slate-900/90 border-cyan-500/40 text-center min-w-[200px]">
          <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" /> ESTIMATED INBOUND ETA
          </div>
          <div className="text-4xl font-black font-display text-white mt-1 font-mono">
            {ambulance.etaSeconds > 0 ? (
              <>
                {Math.floor(ambulance.etaSeconds / 60)}m {ambulance.etaSeconds % 60}s
              </>
            ) : (
              <span className="text-emerald-400 text-2xl font-bold">ARRIVING AT ER BAY</span>
            )}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-1">
            ⚡ GREEN CORRIDOR PREEMPTION ACTIVE
          </div>
        </div>
      </div>

      {/* Patient Telemetry & ECG Monitor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Real-time ECG Waveform Canvas */}
        <div className="md:col-span-2 glass-panel p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="font-bold text-sm text-white font-display flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> LIVE IN-CABIN PATIENT ECG WAVEFORM (LEAD II)
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-bold">
              STREAMING • 250Hz
            </span>
          </div>

          <div className="w-full h-44 rounded-xl overflow-hidden border border-emerald-500/20 relative my-2">
            <canvas ref={ecgCanvasRef} width={600} height={176} className="w-full h-full" />
            <div className="absolute top-2 left-3 text-[10px] text-emerald-400 font-mono">
              HR: {patient?.heartRate || 104} BPM (Sinus Tachycardia)
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-4 gap-3 mt-2 text-center">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <Heart className="w-3 h-3 text-red-500" /> HEART RATE
              </div>
              <div className="text-xl font-bold font-display text-white mt-1">
                {patient?.heartRate || 104} <span className="text-xs text-slate-400 font-normal">bpm</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" /> SpO2 SAT
              </div>
              <div className="text-xl font-bold font-display text-cyan-400 mt-1">
                {patient?.spo2 || 97}%
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <Droplet className="w-3 h-3 text-amber-400" /> BLOOD PRESSURE
              </div>
              <div className="text-xl font-bold font-display text-white mt-1">
                {patient?.bp || '138/88'}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <Thermometer className="w-3 h-3 text-rose-400" /> TEMP
              </div>
              <div className="text-xl font-bold font-display text-white mt-1">
                37.2°C
              </div>
            </div>
          </div>
        </div>

        {/* Patient Info & Preparation Checklist */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div>
            <div className="font-bold text-sm text-white font-display border-b border-slate-800 pb-3 mb-3 flex items-center justify-between">
              <span>PATIENT TRIAGE FILE</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-mono font-bold">
                CODE RED
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Patient:</span>
                <span className="font-bold text-white">John Doe, 58M</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Chief Complaint:</span>
                <span className="font-bold text-rose-400">Acute STEMI / Chest Pain</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Intravenous Access:</span>
                <span className="text-emerald-400 font-mono">18G Left Forearm</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Oxygen Therapy:</span>
                <span className="text-white font-mono">4L/min High Flow</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-200 mb-2 font-display flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> ER INTAKE CHECKLIST
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Trauma Bay 2 Cleared & Sanitized
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Cath Lab On-Call Team Alerted
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Defibrillator & ECG Pre-set
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
