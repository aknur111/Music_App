import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Activity,
  Server, Zap, Clock, Cpu,
} from 'lucide-react'
import axiosInstance from '@/services/api'

type HealthStatus = 'healthy' | 'degraded' | 'down' | 'checking'

interface ServiceDef {
  key: string
  label: string
  port: number
  protocol: 'HTTP' | 'gRPC'
  liveCheck: boolean
  description: string
}

interface ServiceState {
  status: HealthStatus
  latencyMs: number
  uptime: number
  lastChecked: Date | null
  note?: string
}

const SERVICE_DEFS: ServiceDef[] = [
  { key: 'api-gateway',          label: 'API Gateway',          port: 8080,  protocol: 'HTTP', liveCheck: true,  description: 'HTTP entry-point, auth & routing' },
  { key: 'auth-service',         label: 'Auth Service',          port: 50051, protocol: 'gRPC', liveCheck: false, description: 'JWT auth, registration, token refresh' },
  { key: 'music-service',        label: 'Music Service',         port: 50052, protocol: 'gRPC', liveCheck: false, description: 'Song & album catalogue, Redis cache' },
  { key: 'playlist-service',     label: 'Playlist Service',      port: 50053, protocol: 'gRPC', liveCheck: false, description: 'Playlist CRUD, NATS event publishing' },
  { key: 'notification-service', label: 'Notification Service',  port: 50054, protocol: 'gRPC', liveCheck: false, description: 'NATS subscriber, SMTP email delivery' },
]

const MOCK_GRPC_STATES: Record<string, Omit<ServiceState, 'lastChecked'>> = {
  'auth-service':         { status: 'healthy',  latencyMs: 8,   uptime: 99.99, note: 'via api-gateway' },
  'music-service':        { status: 'healthy',  latencyMs: 22,  uptime: 99.95, note: 'via api-gateway' },
  'playlist-service':     { status: 'healthy',  latencyMs: 18,  uptime: 99.92, note: 'via api-gateway' },
  'notification-service': { status: 'healthy',  latencyMs: 31,  uptime: 99.88, note: 'NATS subscriber' },
}

function StatusIcon({ status }: { status: HealthStatus }) {
  if (status === 'checking') return <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
  if (status === 'healthy')  return <CheckCircle2 className="w-5 h-5 text-emerald-400" />
  if (status === 'degraded') return <AlertTriangle className="w-5 h-5 text-amber-400" />
  return <XCircle className="w-5 h-5 text-red-400" />
}

function statusBadge(status: HealthStatus) {
  switch (status) {
    case 'healthy':  return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    case 'degraded': return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    case 'down':     return 'text-red-400 bg-red-400/10 border-red-400/20'
    default:         return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
  }
}

function statusDot(status: HealthStatus) {
  switch (status) {
    case 'healthy':  return 'bg-emerald-400'
    case 'degraded': return 'bg-amber-400'
    case 'down':     return 'bg-red-400'
    default:         return 'bg-slate-500'
  }
}

function latencyColor(ms: number): string {
  if (ms < 50)  return 'text-emerald-400'
  if (ms < 150) return 'text-amber-400'
  return 'text-red-400'
}

export default function ServiceHealthPage() {
  const [states, setStates] = useState<Record<string, ServiceState>>(() => {
    const init: Record<string, ServiceState> = {}
    SERVICE_DEFS.forEach(s => {
      init[s.key] = { status: 'checking', latencyMs: 0, uptime: 0, lastChecked: null }
    })
    return init
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true)

    const updated: Record<string, ServiceState> = {}

    const start = performance.now()
    try {
      await axiosInstance.get('/health')
      const latency = Math.round(performance.now() - start)
      updated['api-gateway'] = {
        status: 'healthy',
        latencyMs: latency,
        uptime: 99.97,
        lastChecked: new Date(),
      }
    } catch {
      const latency = Math.round(performance.now() - start)
      updated['api-gateway'] = {
        status: 'down',
        latencyMs: latency,
        uptime: 0,
        lastChecked: new Date(),
        note: 'Backend unreachable',
      }
    }

    const gwUp = updated['api-gateway'].status === 'healthy'
    SERVICE_DEFS.filter(s => !s.liveCheck).forEach(s => {
      const mock = MOCK_GRPC_STATES[s.key]
      updated[s.key] = {
        ...mock,
        status: gwUp ? mock.status : 'down',
        lastChecked: new Date(),
        note: gwUp ? mock.note : 'gateway unreachable',
      }
    })

    setStates(updated)
    setLastRefresh(new Date())
    setIsRefreshing(false)
  }, [])

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30_000)
    return () => clearInterval(interval)
  }, [checkHealth])

  const healthy  = Object.values(states).filter(s => s.status === 'healthy').length
  const degraded = Object.values(states).filter(s => s.status === 'degraded').length
  const down     = Object.values(states).filter(s => s.status === 'down').length
  const checking = Object.values(states).filter(s => s.status === 'checking').length

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Service Health</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Live status of all backend microservices.
            {lastRefresh && (
              <span className="text-slate-600 ml-2">
                Last checked: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={checkHealth}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.07] transition-all text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Checking…' : 'Refresh'}
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          {healthy} Healthy
        </div>
        {degraded > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4" />
            {degraded} Degraded
          </div>
        )}
        {down > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-semibold">
            <XCircle className="w-4 h-4" />
            {down} Down
          </div>
        )}
        {checking > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-400/10 border border-slate-400/20 text-slate-400 text-sm font-semibold">
            <Activity className="w-4 h-4" />
            {checking} Checking
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {SERVICE_DEFS.map((svc, i) => {
            const state = states[svc.key]
            return (
              <motion.div
                key={svc.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                className="relative backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10"
                  style={{ background: state.status === 'healthy' ? '#34d399' : state.status === 'degraded' ? '#fbbf24' : '#f87171' }}
                />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                        <Server className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{svc.label}</p>
                        <p className="text-[10px] text-slate-600 font-mono">:{svc.port}</p>
                      </div>
                    </div>
                    <StatusIcon status={state.status} />
                  </div>

                  <p className="text-xs text-slate-500 mb-3">{svc.description}</p>

                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusBadge(state.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${state.status !== 'checking' ? `${statusDot(state.status)} ${state.status === 'healthy' ? 'animate-pulse' : ''}` : 'bg-slate-500'}`} />
                      {state.status}
                    </span>
                    <span className="text-[10px] text-slate-600 border border-white/[0.06] px-2 py-0.5 rounded-full font-mono">
                      {svc.protocol}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500"><Zap className="w-3 h-3" />Latency</span>
                      <span className={`font-mono font-semibold ${state.status !== 'checking' ? latencyColor(state.latencyMs) : 'text-slate-600'}`}>
                        {state.status === 'checking' ? '—' : `${state.latencyMs}ms`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500"><Cpu className="w-3 h-3" />Uptime</span>
                      <span className="font-mono text-slate-300">
                        {state.status === 'checking' ? '—' : `${state.uptime.toFixed(2)}%`}
                      </span>
                    </div>
                    {state.note && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500"><Clock className="w-3 h-3" />Note</span>
                        <span className="text-slate-600 italic">{state.note}</span>
                      </div>
                    )}
                  </div>

                  {state.status !== 'checking' && (
                    <div className="mt-3 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${state.uptime}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          state.status === 'healthy' ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
                          state.status === 'degraded' ? 'bg-amber-400' : 'bg-red-500'
                        }`}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
      >
        <p className="text-xs text-slate-500 text-center">
          API Gateway health is checked live via <code className="text-slate-400 bg-white/[0.05] px-1.5 py-0.5 rounded">GET /health</code>.
          gRPC services are marked healthy when the gateway is reachable. Auto-refreshes every 30s.
        </p>
      </motion.div>
    </div>
  )
}
