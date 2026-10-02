import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { TrendingUp, Clock, ShieldCheck, Zap, Award, FileText } from 'lucide-react';

const transitTimeData = [
  { junction: 'Station Depot', StandardTime: 0, GreenCorridorTime: 0 },
  { junction: 'Junction 1', StandardTime: 3.2, GreenCorridorTime: 1.8 },
  { junction: 'Junction 2', StandardTime: 7.5, GreenCorridorTime: 3.9 },
  { junction: 'Junction 3', StandardTime: 12.1, GreenCorridorTime: 6.2 },
  { junction: 'Junction 4', StandardTime: 15.8, GreenCorridorTime: 8.1 },
  { junction: 'City General ER', StandardTime: 19.4, GreenCorridorTime: 10.5 }
];

const intersectionDelayData = [
  { junction: 'Junction 1', NormalDelaySec: 74, PriorityDelaySec: 4 },
  { junction: 'Junction 2', NormalDelaySec: 92, PriorityDelaySec: 6 },
  { junction: 'Junction 3', NormalDelaySec: 110, PriorityDelaySec: 3 },
  { junction: 'Junction 4', NormalDelaySec: 85, PriorityDelaySec: 5 },
  { junction: 'Junction 5', NormalDelaySec: 65, PriorityDelaySec: 2 },
  { junction: 'Junction 6', NormalDelaySec: 88, PriorityDelaySec: 4 }
];

export default function AnalyticsPanel() {
  return (
    <div className="space-y-6">
      {/* Metric Cards Top */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 flex items-center justify-between border-emerald-500/30">
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase">TOTAL RESPONSE TIME SAVED</div>
            <div className="text-3xl font-black font-display text-emerald-400 mt-1">8m 54s</div>
            <div className="text-[11px] text-emerald-400 mt-0.5 font-bold">45.8% Faster Arrival</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase">AVG DELAY PER JUNCTION</div>
            <div className="text-3xl font-black font-display text-white mt-1">4.0s</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Down from 85.6s average</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase">SUCCESSFUL PREEMPTIONS</div>
            <div className="text-3xl font-black font-display text-cyan-400 mt-1">100%</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">Zero Cross-Traffic Collisions</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase">IDLING EMISSIONS CUT</div>
            <div className="text-3xl font-black font-display text-amber-400 mt-1">- 68%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Reduced fuel waste</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-amber-400 border border-slate-700">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transit Time Cumulative Comparison Line Chart */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-sm text-white font-display flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> CUMULATIVE TRANSIT TIME (MINUTES)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Standard Uncoordinated Signal Routing vs Green Corridor Priority
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transitTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="junction" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="StandardTime"
                  name="Standard Signals (No Priority)"
                  stroke="#FF1744"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="GreenCorridorTime"
                  name="Green Corridor Automated System"
                  stroke="#00E676"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intersection Delay Avoided Bar Chart */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-sm text-white font-display flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" /> INTERSECTION STOP DELAY (SECONDS)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Stop-and-go delay per junction bottleneck
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intersectionDelayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="junction" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} label={{ value: 'Delay (sec)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="NormalDelaySec" name="Normal Signal Red Light Delay" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PriorityDelaySec" name="Priority Preemption Delay" fill="#00E676" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Historical Dispatch Performance Summary Table */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <h3 className="font-bold text-sm text-white font-display flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" /> HISTORICAL PREEMPTION DISPATCH LOGS
          </h3>
          <span className="text-xs text-slate-400 font-mono">Export CSV / JSON</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="p-3">DISPATCH ID</th>
                <th className="p-3">PRIORITY</th>
                <th className="p-3">ROUTE CORRIDOR</th>
                <th className="p-3">GEOFENCE CLEARED</th>
                <th className="p-3">TIME SAVED</th>
                <th className="p-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr className="hover:bg-slate-900/40">
                <td className="p-3 font-bold text-cyan-400">DISP-2026-0901</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">CODE 3</span></td>
                <td className="p-3 text-slate-200">Depot 1 ➔ City General ER</td>
                <td className="p-3 text-slate-300">4 Intersections</td>
                <td className="p-3 text-emerald-400 font-bold">4m 18s</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">COMPLETED</span></td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="p-3 font-bold text-cyan-400">DISP-2026-0899</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">CODE 3</span></td>
                <td className="p-3 text-slate-200">Depot 2 ➔ St Jude Trauma</td>
                <td className="p-3 text-slate-300">6 Intersections</td>
                <td className="p-3 text-emerald-400 font-bold">6m 02s</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">COMPLETED</span></td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="p-3 font-bold text-cyan-400">DISP-2026-0894</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">CODE 2</span></td>
                <td className="p-3 text-slate-200">North Junction ➔ Memorial ER</td>
                <td className="p-3 text-slate-300">3 Intersections</td>
                <td className="p-3 text-emerald-400 font-bold">2m 45s</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">COMPLETED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
