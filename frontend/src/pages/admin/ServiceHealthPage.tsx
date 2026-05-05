import { motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'
import { MOCK_STATS } from '@/lib/mockData'
import { cn } from '@/lib/utils'

const services = Object.entries(MOCK_STATS.adminDashboard.serviceHealth).map(
  ([key, val]) => ({
    name: key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase()),
    ...val,
  }),
)

function StatusIcon({ status }: { status: string }) {
  if (status === 'healthy') return <CheckCircle2 className="w-5 h-5 text-green-400" />
  if (status === 'degraded') return <AlertTriangle className="w-5 h-5 text-amber-400" />
  return <XCircle className="w-5 h-5 text-red-400" />
}

function statusColor(status: string) {
  if (status === 'healthy') return 'text-green-400 bg-green-400/10 border-green-400/20'
  if (status === 'degraded') return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
  return 'text-red-400 bg-red-400/10 border-red-400/20'
}

export default function ServiceHealthPage() {
  const healthy = services.filter((s) => s.status === 'healthy').length
  const degraded = services.filter((s) => s.status === 'degraded').length
  const down = services.filter((s) => s.status !== 'healthy' && s.status !== 'degraded').length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f8fafc]">Service Health</h1>
          <p className="text-sm text-[#94a3b8] mt-0.5">Real-time status of all backend microservices.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-[#94a3b8] glass hover:text-[#f8fafc] transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-400/10 border border-green-400/20 text-green-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          {healthy} Healthy
        </div>
        {degraded > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            {degraded} Degraded
          </div>
        )}
        {down > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-medium">
            <XCircle className="w-4 h-4" />
            {down} Down
          </div>
        )}
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div key={service.name} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#f8fafc]">{service.name}</h3>
              <StatusIcon status={service.status} />
            </div>
            <span
              className={cn(
                'inline-block px-2 py-0.5 rounded-full text-xs font-medium border capitalize',
                statusColor(service.status),
              )}
            >
              {service.status}
            </span>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Latency</span>
                <span className={cn(
                  'font-mono',
                  service.latencyMs > 100 ? 'text-amber-400' : 'text-green-400',
                )}>
                  {service.latencyMs} ms
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Uptime</span>
                <span className="text-[#94a3b8] font-mono">{service.uptime.toFixed(2)}%</span>
              </div>
            </div>
            {/* Uptime bar */}
            <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  service.uptime >= 99.9 ? 'bg-green-400' : service.uptime >= 99 ? 'bg-amber-400' : 'bg-red-400',
                )}
                style={{ width: `${service.uptime}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
