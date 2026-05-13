import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { RecommendationService } from '@/services/recommendation.service'
import { usePlayerStore } from '@/store/playerStore'
import type { Track } from '@/types'

interface SimilarTracksModalProps {
  trackId: string
  isOpen: boolean
  onClose: () => void
}

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const SimilarTracksModal: React.FC<SimilarTracksModalProps> = ({
  trackId,
  isOpen,
  onClose,
}) => {
  const { playTrack } = usePlayerStore()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!isOpen || !trackId) return
    setLoading(true)
    setError(null)
    RecommendationService.getSimilarTracks(trackId, 10)
      .then(setTracks)
      .catch(() => setError('Could not load similar tracks.'))
      .finally(() => setLoading(false))
  }, [trackId, isOpen])

  useEffect(() => { load() }, [load])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  function handlePlay(track: Track) {
    playTrack(track)
    RecommendationService.recordPlayback(track.id).catch(console.error)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4"
          >
            <GlassCard padding="none" animatedBorder className="overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
                <h2 className="text-base font-semibold text-white">Similar Tracks</h2>
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-3 py-3 max-h-[60vh] overflow-y-auto scrollbar-none">
                {loading && (
                  <div className="flex flex-col gap-2 py-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                )}

                {!loading && error && (
                  <div className="flex flex-col items-center py-8 gap-3">
                    <p className="text-white/50 text-sm">{error}</p>
                    <button
                      onClick={load}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!loading && !error && tracks.length === 0 && (
                  <p className="text-center text-white/40 text-sm py-8">No similar tracks found.</p>
                )}

                {!loading && !error && tracks.map((track) => (
                  <motion.button
                    key={track.id}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)', x: 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    onClick={() => handlePlay(track)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left group"
                  >
                    <div className="relative w-9 h-9 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
                      <img
                        src={track.coverUrl || '/placeholder-cover.png'}
                        alt={track.album}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-violet-300 transition-colors">
                        {track.title}
                      </p>
                      <p className="text-xs text-white/40 truncate">{track.artist}</p>
                    </div>
                    <span className="text-xs text-white/30 tabular-nums flex-shrink-0">
                      {formatDuration(track.duration)}
                    </span>
                  </motion.button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
