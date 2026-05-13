import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { RecommendationService } from '@/services/recommendation.service'
import type { MoodMeta } from '@/types/recommendation'

const MOOD_CONFIG: Record<string, { from: string; to: string; glow: string }> = {
  happy:     { from: '#f59e0b', to: '#fbbf24', glow: '#f59e0b' },
  sad:       { from: '#3b82f6', to: '#6366f1', glow: '#6366f1' },
  energetic: { from: '#ef4444', to: '#ec4899', glow: '#ec4899' },
  chill:     { from: '#06b6d4', to: '#14b8a6', glow: '#06b6d4' },
  focus:     { from: '#8b5cf6', to: '#6366f1', glow: '#8b5cf6' },
  workout:   { from: '#f97316', to: '#ef4444', glow: '#f97316' },
  romantic:  { from: '#ec4899', to: '#f43f5e', glow: '#ec4899' },
  angry:     { from: '#dc2626', to: '#7f1d1d', glow: '#dc2626' },
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const card = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } }

export default function DiscoverMoodsPage() {
  const navigate = useNavigate()
  const [moods, setMoods] = useState<MoodMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    RecommendationService.listMoods()
      .then(setMoods)
      .catch(() => setError('Could not load moods. Check your connection.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-6 pb-32">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Discover</h1>
        </div>
        <p className="text-white/40 text-sm">Pick a vibe and get a curated playlist from our ML engine</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-24 gap-4">
          <p className="text-white/40">{error}</p>
          <button onClick={load} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm transition-colors">
            Retry
          </button>
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {moods.map((mood) => {
            const cfg = MOOD_CONFIG[mood.key] ?? { from: '#8b5cf6', to: '#6366f1', glow: '#8b5cf6' }
            return (
              <motion.div key={mood.key} variants={card}>
                <motion.button
                  whileHover={{ scale: 1.04, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/discover/moods/${mood.key}`, { state: { mood } })}
                  className="w-full h-44 relative overflow-hidden rounded-2xl border border-white/[0.08] transition-all cursor-pointer text-left"
                  style={{
                    background: `linear-gradient(145deg, ${cfg.from}28, ${cfg.to}18, transparent)`,
                  }}
                >
                  {/* Glow orb */}
                  <div
                    className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl"
                    style={{ background: cfg.glow }}
                  />
                  {/* Grid pattern */}
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                  <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                    <span className="text-5xl leading-none select-none filter drop-shadow-lg">{mood.emoji}</span>
                    <div>
                      <p className="text-base font-bold text-white mb-0.5">{mood.name}</p>
                      <p className="text-xs text-white/45 leading-snug line-clamp-2">{mood.description}</p>
                    </div>
                  </div>

                  {/* Hover border glow */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 transition-opacity"
                    style={{ boxShadow: `inset 0 0 0 1px ${cfg.glow}50` }}
                    whileHover={{ opacity: 1 }}
                  />
                </motion.button>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
