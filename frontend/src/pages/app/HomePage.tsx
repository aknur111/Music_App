import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, Sparkles, TrendingUp, Clock, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MusicService } from '@/services'
import { RecommendationService } from '@/services/recommendation.service'
import { formatDuration } from '@/lib/utils'
import { usePlayerStore } from '@/store/playerStore'
import type { Track, Album, Artist } from '@/types'
import type { MoodMeta } from '@/types/recommendation'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const MOOD_GRADIENTS: Record<string, { from: string; to: string; emoji: string }> = {
  happy:     { from: '#f59e0b', to: '#eab308', emoji: '😊' },
  sad:       { from: '#3b82f6', to: '#6366f1', emoji: '😔' },
  energetic: { from: '#ef4444', to: '#ec4899', emoji: '⚡' },
  chill:     { from: '#06b6d4', to: '#14b8a6', emoji: '🌊' },
  focus:     { from: '#8b5cf6', to: '#6366f1', emoji: '🎯' },
  workout:   { from: '#f97316', to: '#ef4444', emoji: '💪' },
  romantic:  { from: '#ec4899', to: '#f43f5e', emoji: '💕' },
  angry:     { from: '#dc2626', to: '#18181b', emoji: '🔥' },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function HomePage() {
  const navigate = useNavigate()
  const { playTrack } = usePlayerStore()

  const [trendingTracks, setTrendingTracks] = useState<Track[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [moods, setMoods] = useState<MoodMeta[]>([])
  const [personalTracks, setPersonalTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [ratedTracks, setRatedTracks] = useState<Record<string, number>>({})

  useEffect(() => {
    Promise.all([
      RecommendationService.getTrendingTracks(6).catch(() => [] as Track[]),
      MusicService.getAlbums(),
      MusicService.getArtists(),
      RecommendationService.listMoods().catch(() => [] as MoodMeta[]),
      RecommendationService.getPersonalRecommendations(6).catch(() => [] as Track[]),
    ]).then(([tr, al, ar, m, p]) => {
      setTrendingTracks(tr)
      setAlbums(al)
      setArtists(ar)
      setMoods(m)
      setPersonalTracks(p)
    }).finally(() => setLoading(false))
  }, [])

  const handleRate = useCallback(async (trackId: string, rating: number) => {
    setRatedTracks((prev) => ({ ...prev, [trackId]: rating }))
    try {
      await RecommendationService.rateTrack(trackId, rating)
    } catch {
      setRatedTracks((prev) => { const n = { ...prev }; delete n[trackId]; return n })
    }
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-10 p-6 pb-32"
    >
      {/* Greeting */}
      <motion.section variants={itemVariants}>
        <h1 className="text-3xl font-bold text-white mb-1">{getGreeting()}</h1>
        <p className="text-white/40">Here's what's trending right now</p>
      </motion.section>

      {/* Featured track hero */}
      {trendingTracks.length > 0 && (
        <motion.section variants={itemVariants}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900/60 to-cyan-900/40 p-8 border border-white/[0.08]">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center gap-6">
              {trendingTracks[0].coverUrl ? (
                <img
                  src={trendingTracks[0].coverUrl}
                  alt={trendingTracks[0].title}
                  className="w-24 h-24 rounded-2xl object-cover shadow-2xl flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-8 h-8 text-violet-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-violet-300 font-semibold mb-1 uppercase tracking-wider">Trending #1</div>
                <h2 className="text-2xl font-bold text-white truncate">{trendingTracks[0].title}</h2>
                <p className="text-white/60 mt-0.5">{trendingTracks[0].artist}</p>
                <p className="text-sm text-white/30 mt-1">{trendingTracks[0].album}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => playTrack(trendingTracks[0], trendingTracks)}
                className="flex-shrink-0 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-900/50 transition-colors"
              >
                <Play className="w-6 h-6 fill-white text-white ml-0.5" />
              </motion.button>
            </div>
          </div>
        </motion.section>
      )}

      {/* Moods grid */}
      {moods.length > 0 && (
        <motion.section variants={itemVariants}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Discover by Mood</h2>
            <button
              onClick={() => navigate('/discover/moods')}
              className="ml-auto text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              See all →
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {moods.slice(0, 8).map((mood) => {
              const g = MOOD_GRADIENTS[mood.key] ?? { from: '#8b5cf6', to: '#6366f1', emoji: '🎵' }
              return (
                <motion.button
                  key={mood.key}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/discover/moods/${mood.key}`, { state: { mood } })}
                  className="relative overflow-hidden rounded-2xl p-4 text-left border border-white/[0.06] transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${g.from}22, ${g.to}18)`,
                    borderColor: `${g.from}30`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{ background: `radial-gradient(circle at top right, ${g.from}, transparent 70%)` }}
                  />
                  <span className="text-2xl block mb-2">{mood.emoji}</span>
                  <p className="text-sm font-semibold text-white">{mood.name}</p>
                  <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{mood.description}</p>
                </motion.button>
              )
            })}
          </div>
        </motion.section>
      )}

      {/* Personal recommendations */}
      {personalTracks.length > 0 && (
        <motion.section variants={itemVariants}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Recommended for You</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {personalTracks.map((track) => (
              <motion.div
                key={track.id}
                whileHover={{ y: -2 }}
                onClick={() => playTrack(track, personalTracks)}
                className="group cursor-pointer flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl p-3 transition-all"
              >
                {track.coverUrl ? (
                  <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                    <Play className="w-4 h-4 text-violet-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-violet-300 transition-colors">{track.title}</p>
                  <p className="text-xs text-white/40 truncate">{track.artist}</p>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 transition-opacity"
                >
                  <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Trending tracks */}
      {trendingTracks.length > 0 && (
        <motion.section variants={itemVariants}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Trending Now</h2>
          </div>
          <div className="space-y-1">
            {trendingTracks.map((track, i) => (
              <motion.div
                key={track.id}
                whileHover={{ x: 2 }}
                onClick={() => playTrack(track, trendingTracks)}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/[0.04] transition-colors group cursor-pointer"
              >
                <span className="w-5 text-right text-sm text-white/25 font-mono flex-shrink-0">{i + 1}</span>
                {track.coverUrl ? (
                  <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{track.title}</p>
                  <p className="text-xs text-white/40">{track.artist}</p>
                </div>
                <span className="text-xs text-white/25 tabular-nums flex-shrink-0">
                  {formatDuration(track.duration)}
                </span>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity flex-shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); handleRate(track.id, 5) }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${ratedTracks[track.id] === 5 ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/30 hover:text-green-400 hover:bg-green-500/10'}`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); handleRate(track.id, 1) }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${ratedTracks[track.id] === 1 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/30 hover:text-red-400 hover:bg-red-500/10'}`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* New releases */}
      {albums.length > 0 && (
        <motion.section variants={itemVariants}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">New Releases</h2>
            <button
              onClick={() => navigate('/albums')}
              className="ml-auto text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              See all →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {albums.slice(0, 5).map((album) => (
              <motion.div
                key={album.id}
                whileHover={{ y: -4 }}
                className="group cursor-pointer"
                onClick={() => navigate(`/albums/${album.id}`)}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-white/5">
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-900/50 to-cyan-900/30" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center">
                      <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium text-white truncate">{album.title}</p>
                <p className="text-xs text-white/40">{album.artist} · {album.releaseYear}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Artists */}
      {artists.length > 0 && (
        <motion.section variants={itemVariants}>
          <h2 className="text-lg font-semibold text-white mb-4">Artists You Might Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {artists.slice(0, 5).map((artist) => (
              <motion.div
                key={artist.id}
                whileHover={{ y: -4 }}
                className="group cursor-pointer text-center"
              >
                <div className="relative w-full aspect-square rounded-full overflow-hidden mb-3 mx-auto max-w-[120px] bg-white/5">
                  {artist.avatarUrl ? (
                    <img
                      src={artist.avatarUrl}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-cyan-900/30" />
                  )}
                </div>
                <p className="text-sm font-medium text-white truncate">{artist.name}</p>
                <p className="text-xs text-white/40">{artist.genre}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  )
}
