import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { RecommendationService } from '@/services/recommendation.service'
import type { MoodMeta } from '@/types/recommendation'

const MOOD_GRADIENTS: Record<string, string> = {
  happy:     'from-amber-400/30 to-yellow-500/30',
  sad:       'from-blue-500/30 to-slate-600/30',
  energetic: 'from-red-500/30 to-pink-500/30',
  chill:     'from-cyan-400/30 to-teal-500/30',
  focus:     'from-violet-500/30 to-indigo-600/30',
  workout:   'from-orange-500/30 to-red-600/30',
  romantic:  'from-pink-400/30 to-rose-500/30',
  angry:     'from-red-700/30 to-zinc-900/30',
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

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

  if (loading) {
    return (
      <div className="p-6 pb-32">
        <h1 className="text-3xl font-bold text-white mb-1">Discover by mood</h1>
        <p className="text-white/50 mb-8">Pick a vibe — get a playlist</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-white/5 border border-white/[0.08] animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-white/50">{error}</p>
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 pb-32">
      <h1 className="text-3xl font-bold text-white mb-1">Discover by mood</h1>
      <p className="text-white/50 mb-8">Pick a vibe — get a playlist</p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {moods.map((mood) => {
          const gradient = MOOD_GRADIENTS[mood.key] ?? 'from-violet-500/30 to-indigo-600/30'
          return (
            <motion.div key={mood.key} variants={cardVariants}>
              <GlassCard
                padding="none"
                hoverGlow
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 340, damping: 22 }}
                onClick={() => navigate(`/discover/moods/${mood.key}`, { state: { mood } })}
                className={`relative overflow-hidden cursor-pointer h-40 bg-gradient-to-br ${gradient}`}
              >
                <div className="flex flex-col items-center justify-center h-full gap-2 px-3 text-center">
                  <span className="text-5xl leading-none select-none">{mood.emoji}</span>
                  <span className="text-base font-bold text-white">{mood.name}</span>
                  <span className="text-xs text-white/60 leading-snug">{mood.description}</span>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
