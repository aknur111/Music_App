import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { MOCK_STATS } from '@/lib/mockData'
import { formatCount } from '@/lib/utils'

const stats = MOCK_STATS.adminDashboard

// Synthetic CPU/memory data for visual richness
const systemData = stats.userGrowth.map((row, i) => ({
  month: row.month,
  cpu: 20 + i * 4 + Math.sin(i) * 5,
  memory: 35 + i * 3,
  requests: stats.playsOverTime[i]?.plays ?? 0,
}))

export default function SystemMetricsPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-[#f8fafc]">System Metrics</h1>
        <p className="text-sm text-[#94a3b8] mt-0.5">Infrastructure resource utilisation over time.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Storage Used',   value: `${stats.storageUsedGb} GB` },
          { label: 'Total Capacity', value: `${stats.storageCapacityGb} GB` },
          { label: 'Active Subs',    value: formatCount(stats.activeSubscriptions) },
          { label: 'Avg Session',    value: `${stats.avgSessionMinutes} min` },
        ].map(({ label, value }) => (
          <div key={label} className="glass rounded-2xl p-4">
            <p className="text-xl font-bold text-[#f8fafc]">{value}</p>
            <p className="text-xs text-[#94a3b8] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Storage utilisation bar */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#f8fafc]">Storage Utilisation</h2>
          <span className="text-sm text-[#94a3b8]">
            {stats.storageUsedGb} / {stats.storageCapacityGb} GB
          </span>
        </div>
        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all"
            style={{ width: `${(stats.storageUsedGb / stats.storageCapacityGb) * 100}%` }}
          />
        </div>
        <p className="text-xs text-[#64748b] mt-2">
          {((stats.storageUsedGb / stats.storageCapacityGb) * 100).toFixed(1)}% used
        </p>
      </div>

      {/* CPU / Memory line chart */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-base font-semibold text-[#f8fafc] mb-4">CPU & Memory Usage (%)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={systemData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(v, name) => [`${(v as number).toFixed(1)}%`, name === 'cpu' ? 'CPU' : 'Memory']}
            />
            <Line type="monotone" dataKey="cpu" stroke="#7c3aed" strokeWidth={2} dot={false} name="cpu" />
            <Line type="monotone" dataKey="memory" stroke="#06b6d4" strokeWidth={2} dot={false} name="memory" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-[#64748b]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-violet-500 inline-block rounded" /> CPU
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-500 inline-block rounded" /> Memory
          </span>
        </div>
      </div>

      {/* Request volume */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-base font-semibold text-[#f8fafc] mb-4">Request Volume (stream plays)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={systemData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCount(v as number)} />
            <Tooltip
              contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
              formatter={(v) => [formatCount(v as number), 'Requests']}
            />
            <Line type="monotone" dataKey="requests" stroke="#f472b6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
