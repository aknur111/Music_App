import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { MOCK_STATS } from '@/lib/mockData'
import { formatCount } from '@/lib/utils'
import { Database, HardDrive, Activity, Cpu, ExternalLink } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'

const stats = MOCK_STATS.adminDashboard

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0')
  const base = 30 + Math.sin(i * 0.5) * 15
  return {
    hour: `${h}:00`,
    cpu: Math.max(5, Math.min(95, base + Math.random() * 10)),
    memory: Math.max(20, Math.min(80, 40 + i * 0.8 + Math.sin(i) * 8)),
    requests: Math.round(1200 + Math.sin(i * 0.4) * 900 + Math.random() * 300),
    errors: Math.round(Math.max(0, Math.random() * 12)),
  }
})

const STORAGE_BREAKDOWN = [
  { category: 'Audio Files',  gb: 290, color: '#f97316' },
  { category: 'Cover Art',    gb: 68,  color: '#fb923c' },
  { category: 'User Data',    gb: 32,  color: '#fbbf24' },
  { category: 'Logs & Cache', gb: 22,  color: '#64748b' },
]

const DB_METRICS = [
  { label: 'Auth DB',         size: '2.4 GB',  connections: 12, qps: 340 },
  { label: 'Music DB',        size: '18.7 GB', connections: 8,  qps: 180 },
  { label: 'Playlist DB',     size: '1.1 GB',  connections: 6,  qps: 90  },
  { label: 'Notification DB', size: '0.3 GB',  connections: 3,  qps: 20  },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="backdrop-blur-xl bg-[#0d0d1a]/90 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-slate-400 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs font-semibold flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          {p.unit || ''}
        </p>
      ))}
    </div>
  )
}

const usedPct = ((stats.storageUsedGb / stats.storageCapacityGb) * 100).toFixed(1)

export default function SystemMetricsPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Metrics</h1>
          <p className="text-slate-400 mt-1 text-sm">Infrastructure utilisation, database stats, and request analytics.</p>
        </div>
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all text-sm font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Grafana
        </a>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Storage Used',   value: `${stats.storageUsedGb} GB`,       icon: HardDrive,   color: '#f97316', bg: 'bg-orange-500/10' },
          { label: 'Total Capacity', value: `${stats.storageCapacityGb} GB`,    icon: Database,    color: '#fb923c', bg: 'bg-orange-400/10' },
          { label: 'Active Subs',    value: formatCount(stats.activeSubscriptions), icon: Activity, color: '#f59e0b', bg: 'bg-amber-500/10' },
          { label: 'Avg Session',    value: `${stats.avgSessionMinutes} min`,   icon: Cpu,         color: '#ef4444', bg: 'bg-red-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            className="relative backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl opacity-20" style={{ background: color }} />
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard padding="lg" hoverGlow glowColor="rgba(249,115,22,0.08)">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Storage Utilisation</h2>
              <p className="text-xs text-slate-500 mt-0.5">{usedPct}% of {stats.storageCapacityGb} GB used</p>
            </div>
            <span className="text-xl font-bold text-white">{stats.storageUsedGb} GB</span>
          </div>
          <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden mb-5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usedPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STORAGE_BREAKDOWN.map(({ category, gb, color }) => (
              <div key={category} className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <div>
                  <p className="text-xs text-slate-300 font-medium">{category}</p>
                  <p className="text-xs text-slate-600">{gb} GB</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
          <GlassCard padding="lg" hoverGlow glowColor="rgba(124,58,237,0.08)">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-white">CPU & Memory (24h)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Hourly average utilisation</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={HOURS} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={5} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cpu"    name="CPU"    stroke="#7c3aed" strokeWidth={2} fill="url(#cpuGrad)" dot={false} unit="%" />
                <Area type="monotone" dataKey="memory" name="Memory" stroke="#06b6d4" strokeWidth={2} fill="url(#memGrad)" dot={false} unit="%" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex gap-5 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-violet-500 inline-block rounded" />CPU</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-cyan-500 inline-block rounded" />Memory</span>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.38 }}
        >
          <GlassCard padding="lg" hoverGlow glowColor="rgba(249,115,22,0.08)">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-white">HTTP Requests & Errors (24h)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Hourly request volume via API Gateway</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={HOURS} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={5} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => formatCount(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="requests" name="Requests" fill="url(#reqGrad)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="errors"   name="Errors"   fill="#ef4444" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-5 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-orange-500/70 inline-block rounded-sm" />Requests</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-red-500/70 inline-block rounded-sm" />Errors</span>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
      >
        <GlassCard padding="none">
          <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-400" />
                Database Instances
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">PostgreSQL per-service statistics</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {DB_METRICS.map((db, i) => (
              <motion.div
                key={db.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.44 + i * 0.05 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                  <Database className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{db.label}</p>
                  <p className="text-xs text-slate-500">{db.size} on disk</p>
                </div>
                <div className="flex items-center gap-6 text-xs">
                  <div className="text-right">
                    <p className="text-slate-300 font-mono font-semibold">{db.connections}</p>
                    <p className="text-slate-600">connections</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400 font-mono font-semibold">{db.qps}/s</p>
                    <p className="text-slate-600">queries</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 font-semibold text-[10px]">ONLINE</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
      >
        <p className="text-xs text-slate-500 text-center">
          CPU, memory, and request data are simulated for demonstration.
          Real-time infrastructure metrics are available in{' '}
          <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
            Grafana
          </a>.
        </p>
      </motion.div>
    </div>
  )
}
