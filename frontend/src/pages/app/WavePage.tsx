import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, SkipForward, Play, Pause, SkipBack, Radio } from 'lucide-react'
import { RecommendationService } from '@/services/recommendation.service'
import { usePlayerStore } from '@/store/playerStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { cn } from '@/lib/utils'
import type { Track } from '@/types'

// ── mood config ───────────────────────────────────────────────────────────────

const MOODS = [
  { key: '', label: 'Pure Wave', emoji: '🌊' },
  { key: 'happy',     label: 'Happy',     emoji: '😊' },
  { key: 'chill',     label: 'Chill',     emoji: '🌿' },
  { key: 'energetic', label: 'Energetic', emoji: '⚡' },
  { key: 'focus',     label: 'Focus',     emoji: '🎯' },
  { key: 'workout',   label: 'Workout',   emoji: '💪' },
  { key: 'romantic',  label: 'Romantic',  emoji: '💕' },
  { key: 'sad',       label: 'Sad',       emoji: '😔' },
  { key: 'angry',     label: 'Angry',     emoji: '🔥' },
]

const MOOD_COLORS: Record<string, [string, string]> = {
  '':          ['#7c3aed', '#06b6d4'],
  happy:       ['#f59e0b', '#fb923c'],
  chill:       ['#06b6d4', '#14b8a6'],
  energetic:   ['#ef4444', '#ec4899'],
  focus:       ['#8b5cf6', '#6366f1'],
  workout:     ['#f97316', '#ef4444'],
  romantic:    ['#ec4899', '#f43f5e'],
  sad:         ['#3b82f6', '#818cf8'],
  angry:       ['#dc2626', '#991b1b'],
}

function g(mood: string, angle = '135deg') {
  const [a, b] = MOOD_COLORS[mood] ?? MOOD_COLORS['']
  return `linear-gradient(${angle}, ${a}, ${b})`
}
function c1(mood: string) { return (MOOD_COLORS[mood] ?? MOOD_COLORS[''])[0] }
function c2(mood: string) { return (MOOD_COLORS[mood] ?? MOOD_COLORS[''])[1] }

// ── helpers ───────────────────────────────────────────────────────────────────

const BAR_COUNT = 36
const BAR_ANGLES = Array.from({ length: BAR_COUNT }, (_, i) => (i / BAR_COUNT) * 360)

function RadialBars({ playing, color }: { playing: boolean; color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {BAR_ANGLES.map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const cx = 50 + 47 * Math.sin(rad)
        const cy = 50 - 47 * Math.cos(rad)
        const maxH = 5 + (i % 5) * 2.5
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2.5,
              background: color,
              left: `${cx}%`,
              top: `${cy}%`,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
            }}
            animate={playing
              ? { height: [`${maxH * 0.3}px`, `${maxH}px`, `${maxH * 0.3}px`], opacity: [0.45, 0.85, 0.45] }
              : { height: `${maxH * 0.25}px`, opacity: 0.18 }
            }
            transition={{
              duration: 0.38 + (i % 7) * 0.08,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: (i % 6) * 0.06,
            }}
          />
        )
      })}
    </div>
  )
}

function VinylGrooves({ playing }: { playing: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full"
      style={{
        background: 'repeating-radial-gradient(circle at 50%, transparent 0%, transparent 6%, rgba(255,255,255,0.025) 6.5%, transparent 7%)',
      }}
      animate={{ rotate: playing ? 360 : 0 }}
      transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
    />
  )
}

function AuroraBlobs({ mood }: { mood: string }) {
  return (
    <>
      <motion.div
        className="absolute rounded-full blur-[120px] pointer-events-none"
        style={{ width: 700, height: 700, background: c1(mood), top: '-30%', left: '-15%', opacity: 0.18 }}
        animate={{ x: [0, 70, -50, 0], y: [0, 50, -30, 0], scale: [1, 1.08, 0.94, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full blur-[140px] pointer-events-none"
        style={{ width: 600, height: 600, background: c2(mood), bottom: '-20%', right: '-10%', opacity: 0.14 }}
        animate={{ x: [0, -60, 40, 0], y: [0, -40, 50, 0], scale: [1, 0.88, 1.12, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
      <motion.div
        className="absolute rounded-full blur-[90px] pointer-events-none"
        style={{ width: 350, height: 350, background: c1(mood), bottom: '25%', left: '30%', opacity: 0.1 }}
        animate={{ x: [0, 90, -25, 0], y: [0, -70, 25, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
      />
    </>
  )
}

// ── component ─────────────────────────────────────────────────────────────────

export default function WavePage() {
  const [mood, setMood] = useState('')
  const [queue, setQueue] = useState<Track[]>([])
  const [playedIds, setPlayedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { playTrack, currentTrack, isPlaying, pause, resume } = usePlayerStore()
  const { isLiked, toggle: toggleFav } = useFavoritesStore()

  const loadingMoreRef = useRef(false)
  const playedIdsRef = useRef<string[]>([])
  playedIdsRef.current = playedIds

  const fetchMore = useCallback(async (m: string, excludeIds: string[]) => {
    if (loadingMoreRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const tracks = await RecommendationService.getMyWave(m, 30, excludeIds)
      setQueue(prev => {
        const seen = new Set(prev.map(t => t.id))
        return [...prev, ...tracks.filter(t => !seen.has(t.id))]
      })
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null); setQueue([]); setPlayedIds([])
    RecommendationService.getMyWave(mood, 30, [])
      .then(tracks => {
        if (cancelled) return
        setQueue(tracks)
        if (tracks.length > 0) playTrack(tracks[0], tracks)
      })
      .catch(() => { if (!cancelled) setError('Could not reach your wave.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [mood])

  const lastId = useRef<string | null>(null)
  useEffect(() => {
    if (!currentTrack || currentTrack.id === lastId.current) return
    lastId.current = currentTrack.id
    setPlayedIds(prev => [...prev, currentTrack.id])
    RecommendationService.recordPlayback(currentTrack.id).catch(() => {})
    setQueue(prev => {
      const idx = prev.findIndex(t => t.id === currentTrack.id)
      if (idx >= prev.length - 5) fetchMore(mood, [...playedIdsRef.current, currentTrack.id])
      return prev
    })
  }, [currentTrack?.id, mood, fetchMore])

  const currentIdx = queue.findIndex(t => t.id === currentTrack?.id)
  const upNext = currentIdx >= 0 ? queue.slice(currentIdx + 1, currentIdx + 6) : []

  const handleSkip = () => {
    if (!currentTrack) return
    RecommendationService.rateTrack(currentTrack.id, 1).catch(() => {})
    if (currentIdx >= 0 && currentIdx < queue.length - 1) playTrack(queue[currentIdx + 1], queue)
  }
  const handlePrev = () => {
    if (currentIdx > 0) playTrack(queue[currentIdx - 1], queue)
  }
  const handleLike = () => {
    if (!currentTrack) return
    toggleFav(currentTrack)
    RecommendationService.rateTrack(currentTrack.id, 5).catch(() => {})
  }

  const liked = currentTrack ? isLiked(currentTrack.id) : false
  const activeMood = MOODS.find(m => m.key === mood) ?? MOODS[0]

  return (
    <div
      className="relative overflow-hidden flex flex-col"
      style={{ height: 'calc(100vh - 10rem)' }}
    >
      {/* ── Background layers ──────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[#06060e]" />

      <AnimatePresence>
        {currentTrack?.coverUrl && (
          <motion.div
            key={currentTrack.id + '-bg'}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${currentTrack.coverUrl})`,
              filter: 'blur(90px) brightness(0.1) saturate(3)',
              transform: 'scale(1.25)',
            }}
          />
        )}
      </AnimatePresence>

      <AuroraBlobs mood={mood} />

      {/* Scan-line texture for depth */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,1) 3px, rgba(255,255,255,1) 4px)' }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06060e]/70 via-transparent to-[#06060e]/60 pointer-events-none" />

      {/* ── Mood pill bar (top) ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 px-5 pt-3.5 pb-2.5">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {MOODS.map(m => (
            <motion.button
              key={m.key}
              whileTap={{ scale: 0.91 }}
              onClick={() => setMood(m.key)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all duration-200',
                mood === m.key
                  ? 'text-white border-transparent'
                  : 'bg-white/[0.04] border-white/[0.07] text-white/40 hover:text-white/70 hover:bg-white/[0.06]',
              )}
              style={mood === m.key ? { background: g(m.key), boxShadow: `0 0 18px ${c1(m.key)}55` } : undefined}
            >
              <span className="text-sm leading-none">{m.emoji}</span>
              {m.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Main two-column stage ───────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 min-h-0">

        {/* LEFT — disc stage */}
        <div className="flex-1 flex items-center justify-center">
          {loading ? (
            <motion.div
              className="rounded-full"
              style={{ width: 290, height: 290, background: g(mood) + '22' }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          ) : (
            <div className="relative" style={{ width: 290, height: 290 }}>

              {/* Outer glow */}
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{ inset: -30, background: `radial-gradient(circle, ${c1(mood)}28 0%, transparent 68%)` }}
                animate={{ scale: isPlaying ? [1, 1.07, 1] : 1, opacity: isPlaying ? [0.5, 1, 0.5] : 0.3 }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Sonar rings */}
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="absolute rounded-full pointer-events-none"
                  style={{ inset: -i * 22, border: `1px solid ${c1(mood)}`, opacity: 0 }}
                  animate={isPlaying ? { opacity: [0.5, 0, 0.5], scale: [0.95, 1.04 + i * 0.02, 0.95] } : {}}
                  transition={{ duration: 1.8 + i * 0.7, repeat: Infinity, ease: 'easeOut', delay: i * 0.5 }}
                />
              ))}

              {/* Radial frequency bars */}
              <RadialBars playing={isPlaying} color={c1(mood)} />

              {/* Vinyl disc */}
              <div
                className="absolute inset-0 rounded-full overflow-hidden shadow-2xl"
                style={{ background: 'radial-gradient(circle at 50%, #1c1c30 0%, #0d0d1a 55%, #060610 100%)' }}
              >
                <VinylGrooves playing={isPlaying} />
              </div>

              {/* Album art */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTrack?.id ?? 'empty'}
                  initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className="absolute rounded-full overflow-hidden"
                  style={{ inset: 32, boxShadow: `0 0 0 2px ${c1(mood)}44, 0 8px 40px rgba(0,0,0,0.6)` }}
                >
                  {currentTrack?.coverUrl
                    ? <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full" style={{ background: g(mood) }} />
                  }
                </motion.div>
              </AnimatePresence>

              {/* Spindle */}
              <motion.div
                className="absolute rounded-full border-2 border-white/15"
                style={{
                  width: 14, height: 14,
                  top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)',
                  background: g(mood),
                  boxShadow: `0 0 10px ${c1(mood)}88`,
                }}
                animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          )}
        </div>

        {/* RIGHT — glass info panel */}
        <div
          className="flex-shrink-0 flex flex-col border-l border-white/[0.06]"
          style={{
            width: 360,
            background: 'linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Panel header */}
          <div className="flex-shrink-0 px-7 pt-6 pb-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Radio className="w-3.5 h-3.5 text-white/25" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/25">Personal Radio</span>
            </div>
            <div className="relative">
              {/* Ghost watermark */}
              <span
                className="absolute -top-3 -left-1 text-[88px] font-black leading-none select-none pointer-events-none"
                style={{ color: `${c1(mood)}0d` }}
              >
                WAVE
              </span>
              <h1
                className="relative text-4xl font-black tracking-tight text-white"
                style={{ textShadow: `0 0 60px ${c1(mood)}55` }}
              >
                My Wave
              </h1>
            </div>
          </div>

          {/* Track info */}
          <div className="flex-1 flex flex-col justify-center px-7 min-h-0">
            {loading ? (
              <div className="space-y-3">
                <div className="h-6 w-4/5 rounded-lg bg-white/[0.06] animate-pulse" />
                <div className="h-4 w-2/5 rounded-lg bg-white/[0.04] animate-pulse" />
              </div>
            ) : error ? (
              <div className="space-y-3">
                <p className="text-white/35 text-sm">{error}</p>
                <button
                  onClick={() => setMood(m => m)}
                  className="text-xs text-white/50 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/5 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Track name + artist */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTrack?.id ?? 'empty'}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-1.5"
                  >
                    {/* Live bars */}
                    <div className="flex items-end gap-[3px] h-4 mb-3">
                      {[1,2,3,4,5,6,7].map(b => (
                        isPlaying ? (
                          <motion.span
                            key={b}
                            className="w-[2.5px] rounded-full"
                            style={{ background: g(mood, '180deg'), height: '3px' }}
                            animate={{ height: [`${2+(b%3)}px`, `${8+b*2}px`, `${2+(b%3)}px`] }}
                            transition={{ duration: 0.28 + b * 0.09, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        ) : (
                          <span
                            key={b}
                            className="w-[2.5px] rounded-full"
                            style={{ background: c1(mood), height: `${3 + (b % 4)}px`, opacity: 0.2 }}
                          />
                        )
                      ))}
                      <span className="text-[9px] text-white/20 font-mono ml-1.5 self-end pb-0.5">
                        {currentIdx >= 0 ? `${currentIdx + 1} / ${queue.length}` : ''}
                      </span>
                    </div>

                    <h2 className="text-[22px] font-black text-white leading-tight line-clamp-2">
                      {currentTrack?.title ?? '—'}
                    </h2>
                    <p className="text-sm text-white/40 truncate">{currentTrack?.artist ?? ''}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Controls */}
                <div className="flex items-center gap-2.5">
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
                    onClick={handlePrev}
                    disabled={currentIdx <= 0}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all disabled:opacity-20"
                  >
                    <SkipBack className="w-4 h-4 text-white/65" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                    onClick={isPlaying ? pause : resume}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
                    style={{ background: g(mood), boxShadow: `0 0 30px ${c1(mood)}55` }}
                  >
                    {isPlaying
                      ? <Pause className="w-7 h-7 text-white fill-white" />
                      : <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                    }
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
                    onClick={handleSkip}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
                  >
                    <SkipForward className="w-4 h-4 text-white/65" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
                    onClick={handleLike}
                    className={cn(
                      'ml-1 w-10 h-10 rounded-2xl flex items-center justify-center border transition-all',
                      liked
                        ? 'bg-pink-500/15 border-pink-500/30'
                        : 'bg-white/[0.06] border-white/[0.08] hover:bg-white/[0.1]',
                    )}
                  >
                    <Heart className={cn('w-4 h-4 transition-colors', liked ? 'fill-pink-400 text-pink-400' : 'text-white/60')} />
                  </motion.button>
                </div>

                {/* Active mood badge */}
                <motion.div
                  key={mood}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                  style={{ background: `${c1(mood)}18`, border: `1px solid ${c1(mood)}28`, color: c1(mood) }}
                >
                  <span>{activeMood.emoji}</span>
                  <span>{activeMood.label} radio</span>
                </motion.div>
              </div>
            )}
          </div>

          {/* Up next */}
          {upNext.length > 0 && !loading && !error && (
            <div className="flex-shrink-0 border-t border-white/[0.05]">
              <div className="px-5 pt-3 pb-1 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/20">Up Next</span>
                {loadingMore && (
                  <div className="w-3 h-3 rounded-full border border-violet-500 border-t-transparent animate-spin" />
                )}
              </div>
              <div className="pb-3 space-y-0">
                {upNext.map((track, i) => (
                  <motion.button
                    key={track.id}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)', x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => playTrack(track, queue)}
                    className="w-full flex items-center gap-3 px-5 py-2 transition-all text-left"
                  >
                    <span className="text-[9px] text-white/20 font-mono w-3 flex-shrink-0">+{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/[0.05] flex-shrink-0">
                      {track.coverUrl
                        ? <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full opacity-30" style={{ background: g(mood) }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-white/65 truncate leading-tight">{track.title}</p>
                      <p className="text-[10px] text-white/30 truncate">{track.artist}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
