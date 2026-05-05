import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import {
  Users, Music2, Radio, DollarSign, TrendingUp, TrendingDown,
  Clock, UserPlus, ListMusic,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { MOCK_STATS } from '@/lib/mockData'
import { formatCount } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'

const stats = MOCK_STATS.adminDashboard

// ─── Extended mock data ───────────────────────────────────────────────────────

const DAU_30D = Array.from({ length: 30 }, (_, i) => {
  const base = 42_000 + Math.sin(i * 0.4) * 8000 + i * 200
  return {
    day: `Apr ${i + 1}`,
    dau: Math.round(base + Math.random() * 3000),
  }
})

const GENRE_DATA = stats.topGenres.map(g => ({ name: g.genre, value: g.plays, pct: g.percentage }))

const TOP_ARTISTS = [
  { artist: 'Burial', plays: 4_820_000 },
  { artist: 'Four Tet', plays: 4_110_000 },
  { artist: 'Bonobo', plays: 3_750_000 },
  { artist: 'Moderat', plays: 3_200_000 },
  { artist: 'James Blake', plays: 2_980_000 },
  { artist: 'Jon Hopkins', plays: 2_640_000 },
  { artist: 'Boards of Canada', plays: 2_310_000 },
]

const RECENT_ACTIVITY = [
  { id: 1, type: 'user_registered',   label: 'New user registered',    detail: 'prism_wave joined AURA',               time: '2 min ago',  icon: UserPlus },
  { id: 2, type: 'track_added',       label: 'Track uploaded',          detail: '"Cascades" by Moderat added',           time: '7 min ago',  icon: Music2 },
  { id: 3, type: 'playlist_created',  label: 'Playlist created',        detail: 'stellar_ears created "Dusk Drive"',     time: '12 min ago', icon: ListMusic },
  { id: 4, type: 'user_registered',   label: 'New user registered',     detail: 'void_canyon joined AURA',               time: '18 min ago', icon: UserPlus },
  { id: 5, type: 'track_added',       label: 'Track uploaded',          detail: '"Drift" by Burial added',               time: '24 min ago', icon: Music2 },
  { id: 6, type: 'playlist_created',  label: 'Playlist created',        detail: 'nova_beat created "Techno Cathedral"',  time: '31 min ago', icon: ListMusic },
  { id: 7, type: 'user_registered',   label: 'New user registered',     detail: 'hazel_freq joined AURA',                time: '38 min ago', icon: UserPlus },
  { id: 8, type: 'track_added',       label: 'Track uploaded',          detail: '"Folded" by Jon Hopkins added',         time: '45 min ago', icon: Music2 },
  { id: 9, type: 'playlist_created',  label: 'Playlist created',        detail: 'deepfreq created "Late Shift"',         time: '52 min ago', icon: ListMusic },
  { id: 10, type: 'track_added',      label: 'Track uploaded',          detail: '"Sunken" by Bonobo added',              time: '1 hr ago',   icon: Music2 },
]

const SERVICE_HEALTH = [
  { name: 'api-gateway', port: 8080,  status: 'ONLINE', uptime: 99.97, latencyMs: 12  },
  { name: 'auth',        port: 50051, status: 'ONLINE', uptime: 99.99, latencyMs: 8   },
  { name: 'music',       port: 50052, status: 'ONLINE', uptime: 99.95, latencyMs: 22  },
  { name: 'playlist',    port: 50053, status: 'ONLINE', uptime: 99.92, latencyMs: 18  },
]

const GENRE_COLORS = ['#f97316', '#ef4444', '#fb923c', '#fbbf24', '#f43f5e', '#e879f9']

// ─── Shared tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="backdrop-blur-xl bg-[#0d0d1a]/90 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-sm font-semibold" style={{ color: p.color }}>
          {typeof p.value === 'number' ? formatCount(p.value) : p.value}
          <span className="text-slate-400 font-normal ml-1">{p.name}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ target, prefix = '', suffix = '', decimals = 0 }: {
  target: number; prefix?: string; suffix?: string; decimals?: number
}) {
  const motionVal = useMotionValue(0)
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    const controls = animate(motionVal, target, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
    })
    const unsubscribe = motionVal.on('change', v => {
      setDisplay(
        decimals > 0
          ? v.toFixed(decimals)
          : Math.round(v) >= 1_000_000
            ? `${(v / 1_000_000).toFixed(1)}M`
            : Math.round(v) >= 1_000
              ? `${(v / 1_000).toFixed(1)}K`
              : Math.round(v).toString()
      )
    })
    return () => { controls.stop(); unsubscribe() }
  }, [target])

  return <span>{prefix}{display}{suffix}</span>
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: number
  prefix?: string
  suffix?: string
  trend?: number
  trendLabel?: string
  icon: React.ElementType
  accentColor: string
  bgColor: string
  live?: boolean
  delay?: number
}

function KpiCard({ label, value, prefix, suffix, trend, trendLabel, icon: Icon, accentColor, bgColor, live, delay = 0 }: KpiCardProps) {
  const positive = trend === undefined || trend >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ boxShadow: `0 0 32px ${accentColor}22, 0 8px 32px rgba(0,0,0,0.4)` }}
      className="relative backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 overflow-hidden transition-all duration-300"
    >
      {/* Background glow blob */}
      <div
        className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-20"
        style={{ background: accentColor }}
      />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center mb-4`}>
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">
            <AnimatedCounter target={value} prefix={prefix} suffix={suffix} />
          </div>
          <div className="text-sm text-slate-400 mt-1 font-medium">{label}</div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {positive ? '+' : ''}{trend}%
              {trendLabel && <span className="text-slate-500 font-normal ml-1">{trendLabel}</span>}
            </div>
          )}
        </div>
        {live && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const activityTypeColor: Record<string, string> = {
    user_registered: 'text-orange-400',
    track_added: 'text-sky-400',
    playlist_created: 'text-violet-400',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-400 mt-1 text-sm">Welcome back — here's what's happening with AURA today.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <Clock className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs text-slate-300 font-mono tabular-nums">
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-xs text-slate-500">
            {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Users"
          value={2_847_391}
          trend={12.4}
          trendLabel="vs last month"
          icon={Users}
          accentColor="#f97316"
          bgColor="bg-orange-500/15"
          delay={0}
        />
        <KpiCard
          label="Active Streams"
          value={48_291}
          icon={Radio}
          accentColor="#ef4444"
          bgColor="bg-red-500/15"
          live
          delay={0.08}
        />
        <KpiCard
          label="Total Tracks"
          value={15_847}
          trend={3.2}
          trendLabel="this week"
          icon={Music2}
          accentColor="#fb923c"
          bgColor="bg-orange-400/15"
          delay={0.16}
        />
        <KpiCard
          label="Revenue"
          value={142_398}
          prefix="$"
          trend={8.7}
          trendLabel="this month"
          icon={DollarSign}
          accentColor="#f59e0b"
          bgColor="bg-amber-500/15"
          delay={0.24}
        />
      </div>

      {/* DAU Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <GlassCard hoverGlow glowColor="rgba(249,115,22,0.12)" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Daily Active Users</h2>
              <p className="text-xs text-slate-500 mt-0.5">Last 30 days</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-3 h-0.5 bg-orange-400 inline-block rounded" />
              DAU
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={DAU_30D} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => formatCount(v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="dau"
                name="Users"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#f97316', stroke: '#1a1a2e', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </motion.div>

      {/* Pie + Bar row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genre Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <GlassCard hoverGlow glowColor="rgba(249,115,22,0.10)" padding="lg">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-white">Genre Distribution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Share of total plays by genre</p>
            </div>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={GENRE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {GENRE_DATA.map((_, i) => (
                      <Cell key={i} fill={GENRE_COLORS[i % GENRE_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]
                      return (
                        <div className="backdrop-blur-xl bg-[#0d0d1a]/90 border border-white/10 rounded-xl px-3 py-2.5 shadow-2xl">
                          <p className="text-xs text-slate-400">{d.name}</p>
                          <p className="text-sm font-bold text-orange-400">{formatCount(d.value as number)}</p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {GENRE_DATA.map((g, i) => (
                  <div key={g.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: GENRE_COLORS[i % GENRE_COLORS.length] }} />
                      <span className="text-xs text-slate-300">{g.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums">{g.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Top Artists */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.38 }}
        >
          <GlassCard hoverGlow glowColor="rgba(239,68,68,0.10)" padding="lg">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-white">Top Artists by Plays</h2>
              <p className="text-xs text-slate-500 mt-0.5">All-time stream counts</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={TOP_ARTISTS} layout="vertical" margin={{ top: 0, right: 0, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                <XAxis
                  type="number"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => formatCount(v)}
                />
                <YAxis
                  type="category"
                  dataKey="artist"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(249,115,22,0.05)' }} />
                <Bar dataKey="plays" name="Plays" fill="url(#barGrad)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.42 }}
      >
        <GlassCard padding="none">
          <div className="px-6 py-5 border-b border-white/[0.06]">
            <h2 className="text-base font-semibold text-white">Recent Activity</h2>
            <p className="text-xs text-slate-500 mt-0.5">Last 10 platform events</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {RECENT_ACTIVITY.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.44 + i * 0.04 }}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0`}>
                  <event.icon className={`w-4 h-4 ${activityTypeColor[event.type]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{event.label}</p>
                  <p className="text-xs text-slate-500 truncate">{event.detail}</p>
                </div>
                <span className="text-xs text-slate-600 whitespace-nowrap">{event.time}</span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Service Health */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Service Health</h2>
          <span className="text-xs text-slate-500">All systems operational</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICE_HEALTH.map((svc, i) => (
            <motion.div
              key={svc.name}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.52 + i * 0.06 }}
              className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-medium text-slate-300">{svc.name}</span>
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </div>
              </div>
              <div className="text-[10px] text-slate-600 font-mono mb-3">:{svc.port}</div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Latency</span>
                  <span className="text-emerald-400 font-mono">{svc.latencyMs}ms</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Uptime</span>
                  <span className="text-slate-300 font-mono">{svc.uptime}%</span>
                </div>
              </div>
              <div className="mt-3 h-0.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                  style={{ width: `${svc.uptime}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
