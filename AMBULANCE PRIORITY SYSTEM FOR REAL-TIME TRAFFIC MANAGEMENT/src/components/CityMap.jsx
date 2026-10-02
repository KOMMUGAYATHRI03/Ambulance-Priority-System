import React, { useEffect, useRef } from 'react';
import { Shield, Zap, AlertTriangle, Navigation, Radio, MapPin, Activity } from 'lucide-react';

export default function CityMap({
  junctions,
  ambulance,
  routes,
  selectedJunction,
  onSelectJunction,
  onTogglePreemption
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      // Clear screen
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid subtle lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw City Road Networks
      // Main Highway & Cross Streets connecting Junctions
      const mainRoads = [
        { from: { x: 100, y: 150 }, to: { x: 750, y: 150 } },
        { from: { x: 100, y: 350 }, to: { x: 750, y: 350 } },
        { from: { x: 100, y: 550 }, to: { x: 750, y: 550 } },
        { from: { x: 220, y: 80 }, to: { x: 220, y: 620 } },
        { from: { x: 460, y: 80 }, to: { x: 460, y: 620 } },
        { from: { x: 680, y: 80 }, to: { x: 680, y: 620 } }
      ];

      // Draw Road Asphalt & Lane markings
      mainRoads.forEach(road => {
        ctx.shadowBlur = 0;
        // Outer asphalt border
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 36;
        ctx.beginPath();
        ctx.moveTo(road.from.x, road.from.y);
        ctx.lineTo(road.to.x, road.to.y);
        ctx.stroke();

        // Inner dark asphalt
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 30;
        ctx.beginPath();
        ctx.moveTo(road.from.x, road.from.y);
        ctx.lineTo(road.to.x, road.to.y);
        ctx.stroke();

        // Dashed center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(road.from.x, road.from.y);
        ctx.lineTo(road.to.x, road.to.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw Active Emergency Route (Green Corridor Path Highlight)
      if (routes && routes.length > 1) {
        ctx.beginPath();
        ctx.moveTo(routes[0].x, routes[0].y);
        for (let i = 1; i < routes.length; i++) {
          ctx.lineTo(routes[i].x, routes[i].y);
        }
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.4)';
        ctx.lineWidth = 14;
        ctx.shadowColor = '#00E676';
        ctx.shadowBlur = 15;
        ctx.stroke();

        // Inner glowing route pulse
        ctx.strokeStyle = '#00E676';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw Junction Geofences & Signal Lights
      junctions.forEach(j => {
        const isSelected = selectedJunction?.id === j.id;
        const isPreemption = j.preempted;

        // Draw Geofence Radius Ring
        ctx.beginPath();
        ctx.arc(j.x, j.y, j.geofenceRadius, 0, Math.PI * 2);
        ctx.fillStyle = isPreemption
          ? 'rgba(0, 230, 118, 0.05)'
          : 'rgba(59, 130, 246, 0.03)';
        ctx.fill();
        ctx.strokeStyle = isPreemption
          ? 'rgba(0, 230, 118, 0.4)'
          : isSelected
          ? 'rgba(0, 229, 255, 0.5)'
          : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = isPreemption ? 2 : 1;
        if (isPreemption) ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Intersection box node
        ctx.fillStyle = isPreemption ? '#064e3b' : '#1e293b';
        ctx.strokeStyle = isPreemption ? '#00E676' : '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(j.x - 22, j.y - 22, 44, 44, 8);
        ctx.fill();
        ctx.stroke();

        // Traffic Light Status Indicator inside box
        let signalColor = '#00E676'; // default green corridor
        if (!j.preempted) {
          if (j.currentSignal === 'RED') signalColor = '#FF1744';
          else if (j.currentSignal === 'YELLOW') signalColor = '#FFC400';
          else signalColor = '#00E676';
        }

        ctx.beginPath();
        ctx.arc(j.x, j.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = signalColor;
        ctx.shadowColor = signalColor;
        ctx.shadowBlur = j.preempted ? 20 : 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Junction Label & Countdown Timer
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(j.name, j.x, j.y - 30);

        ctx.font = '10px JetBrains Mono, monospace';
        if (j.preempted) {
          ctx.fillStyle = '#00E676';
          ctx.fillText(`⚡ CORRIDOR PRIORITY (${j.countdown}s)`, j.x, j.y + 36);
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`${j.currentSignal} • ${j.countdown}s`, j.x, j.y + 36);
        }
      });

      // Draw Hospitals and Ambulance Dispatch Station icons
      // Station 1
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(100, 150, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('DEPOT 1', 100, 154);

      // Hospital Target (City General)
      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.arc(680, 550, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FF1744';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FF1744';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 16px Outfit';
      ctx.fillText('✚', 680, 555);
      ctx.font = 'bold 11px Outfit';
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('CITY GENERAL ER', 680, 586);

      // Draw Ambulance Marker & Beacon radar
      if (ambulance && ambulance.x && ambulance.y) {
        const ax = ambulance.x;
        const ay = ambulance.y;

        // Dynamic Siren Pulse Ring
        if (ambulance.sirenActive) {
          const pulseSize = (Date.now() % 1500) / 1500 * 60 + 20;
          ctx.beginPath();
          ctx.arc(ax, ay, pulseSize, 0, Math.PI * 2);
          ctx.strokeStyle = (Math.floor(Date.now() / 250) % 2 === 0)
            ? 'rgba(255, 23, 68, 0.6)'
            : 'rgba(0, 229, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Vehicle Base Glow
        ctx.fillStyle = '#dc2626';
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(ax, ay, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Vehicle Icon / Cross
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('🚑', ax, ay + 4);

        // Telemetry Callout Box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(ax + 18, ay - 24, 120, 48, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00E5FF';
        ctx.font = 'bold 10px Outfit';
        ctx.textAlign = 'left';
        ctx.fillText(ambulance.id || 'AMB-101 (CODE 3)', ax + 24, ay - 10);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`${ambulance.speed} km/h • ${ambulance.status}`, ax + 24, ay + 4);
        ctx.fillStyle = ambulance.geofenceTriggered ? '#00E676' : '#94a3b8';
        ctx.fillText(
          ambulance.geofenceTriggered ? 'PREEMPTION ACTIVE' : 'APPROACHING J-3',
          ax + 24,
          ay + 18
        );
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [junctions, ambulance, routes, selectedJunction]);

  return (
    <div className="relative w-full h-[600px] glass-panel p-2 overflow-hidden flex flex-col">
      {/* Map Control Bar Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 glass-panel px-4 py-2 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
          LIVE SIMULATION ACTIVE
        </div>
        <div className="h-4 w-px bg-slate-700"></div>
        <div className="text-slate-300">
          Geofence Preemption Radius: <span className="text-cyan-400 font-mono">250m</span>
        </div>
        <div className="h-4 w-px bg-slate-700"></div>
        <div className="text-slate-300">
          Grid: <span className="text-slate-100 font-mono">Metro North Corridor</span>
        </div>
      </div>

      {/* Map Canvas */}
      <canvas
        ref={canvasRef}
        width={840}
        height={580}
        className="w-full h-full rounded-xl cursor-crosshair"
      />

      {/* Map Legend Overlay bottom right */}
      <div className="absolute bottom-4 right-4 z-10 glass-panel p-3 text-xs flex flex-col gap-1.5 text-slate-300 max-w-xs">
        <div className="font-bold text-slate-100 font-display flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-cyan-400" /> CORRIDOR SYSTEM LEGEND
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] mt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full signal-green inline-block"></span>
            Green Corridor Light
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full signal-red inline-block"></span>
            Cross Traffic Stopped
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-400 inline-block rounded"></span>
            Dynamic Optimal Route
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-dashed border-cyan-400 inline-block"></span>
            Geofence Trigger Zone
          </div>
        </div>
      </div>
    </div>
  );
}
