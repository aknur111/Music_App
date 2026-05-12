import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, ListPlus } from 'lucide-react'
import { TrackCard } from '@/components/shared/TrackCard'
import { RecommendationService } from '@/services/recommendation.service'
import { usePlayerStore } from '@/store/playerStore'
import type { Track } from '@/types'
import type { MoodMeta } from '@/types/recommendation'

const MOOD_GRADIENTS: Record<string, string> = {
  happy:     'from-amber-400/20 to-yellow-500/20',
  sad:       'from-blue-500/20 to-slate-600/20',
  energetic: 'from-red-500/20 to-pink-500/20',
  chill:     'from-cyan-400/20 to-teal-500/20',
  focus:     'from-violet-500/20 to-indigo-600/20',
  workout:   'from-orange-500/20 to-red-600/20',
  romantic:  'from-pink-400/20 to-rose-500/20',
  angry:     'from-red-700/20 to-zinc-900/20',
}

type Tab = 'top' | 'radio'

export default function MoodDetailPage() {
  const { mood = '' } = useParams<{ mood: string }>()
  const location = useLocation()
  const passedMood = (location.state as { mood?: MoodMeta } | null)?.mood

  const { playTrack, addToQueue } = usePlayerStore()

  const [moodMeta, setMoodMeta] = useState<MoodMeta | null>(passedMood ?? null)
  const [tab, setTab] = useState<Tab>('top')
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Resolve mood meta if not passed via navigation state
  useEffect(() => {
    if (moodMeta) return
    RecommendationService.listMoods()
      .then((list) => setMoodMeta(list.find((m) => m.key === mood) ?? null))
      .catch(() => {})
  }, [mood, moodMeta])

  const loadTracks = useCallback(() => {
    setLoading(true)
    setError(null)
    const fetch = tab === 'top'
      ? RecommendationService.getRecommendationsByMood(mood, 20)
      : RecommendationService.getMoodRadio(mood)
    fetch
      .then(setTracks)
      .catch(() => setError('Could not load tracks. Check your connection.'))
      .finally(() => setLoading(false))
  }, [mood, tab])

  useEffect(() => { loadTracks() }, [loadTracks])

  function handlePlayAll() {
    if (tracks.length === 0) return
    playTrack(tracks[0], tracks)
    tracks.forEach((t) => {
      RecommendationService.recordPlayback(t.id).catch(console.error)
    })
  }

  function handleAddAllToQueue() {
    tracks.forEach((t) => addToQueue(t))
  }

  const gradient = MOOD_GRADIENTS[mood] ?? 'from-violet-500/20 to-indigo-600/20'

  return (
    <div className="pb-32">
      {/* Hero */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} border-b border-white/[0.06]`}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d0d1a]/80 pointer-events-none" />
        <div className="relative z-10 flex items-end justify-between gap-4 p-6 pt-10">
          <div className="flex items-end gap-4">
            <span className="text-8xl leading-none select-none">{moodMeta?.emoji ?? '🎵'}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-1">Mood</p>
              <h1 className="text-3xl font-bold text-white">{moodMeta?.name ?? mood}</h1>
              {moodMeta?.description && (
                <p className="text-white/60 mt-1">{moodMeta.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddAllToQueue}
              disabled={tracks.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
              <ListPlus className="w-4 h-4" />
              Add to Queue
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-900/40 transition-colors disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-white" />
              Play All
            </motion.button>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 px-6 pt-5 pb-1">
        {(['top', 'radio'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            {t === 'top' ? 'Top Tracks' : 'Mood Radio'}
          </button>
        ))}
      </div>

      {/* Mood Radio arc banner */}
      {tab === 'radio' && !loading && !error && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/70">
          🎚 30 tracks arranged as an emotional arc — warm-up (1–10) → peak (11–20) → cool-down (21–30)
        </div>
      )}

      {/* Track list */}
      <div className="px-4 pt-4">
        {loading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-white/5 border border-white/[0.06] animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center py-16 gap-4">
            <p className="text-white/50">{error}</p>
            <button
              onClick={loadTracks}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-1">
            {tracks.map((track, i) => (
              <TrackCard
                key={track.id}
                track={track}
                queue={tracks}
                index={i}
                showIndex
                showSimilarButton
                onPlay={(t) => { RecommendationService.recordPlayback(t.id).catch(console.error) }}
                onAddToQueue={(t) => addToQueue(t)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
