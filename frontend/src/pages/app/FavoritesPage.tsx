import { motion } from 'framer-motion'
import { Play, Shuffle, Heart, Clock } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import { usePlayerStore } from '@/store/playerStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { TrackCard } from '@/components/shared/TrackCard'

export default function FavoritesPage() {
  const { playTrack, toggleShuffle } = usePlayerStore()
  const { tracks: likedTracks } = useFavoritesStore()
  const totalDuration = likedTracks.reduce((acc, t) => acc + t.duration, 0)

  const handleShufflePlay = () => {
    if (likedTracks.length === 0) return
    toggleShuffle()
    const shuffled = [...likedTracks].sort(() => Math.random() - 0.5)
    playTrack(shuffled[0], shuffled)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="pb-32"
    >
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-900/25 via-pink-900/10 to-transparent pointer-events-none" />
        <div className="relative p-8 pb-6 flex items-end gap-7">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="w-44 h-44 rounded-2xl bg-gradient-to-br from-pink-500/40 via-rose-600/30 to-violet-700/30 flex items-center justify-center shadow-2xl shadow-pink-900/30 border border-pink-500/10 flex-shrink-0"
          >
            <Heart className="w-20 h-20 fill-pink-400 text-pink-400 drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]" />
          </motion.div>
          <div className="pb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-pink-400/70 mb-2">Playlist</p>
            <h1 className="text-4xl font-black text-white tracking-tight">Liked Songs</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-white/40">
              <span>{likedTracks.length} {likedTracks.length === 1 ? 'song' : 'songs'}</span>
              {likedTracks.length > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(totalDuration)}
                  </span>
                </>
              )}
            </div>

            {likedTracks.length > 0 && (
              <div className="flex items-center gap-3 mt-5">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => playTrack(likedTracks[0], likedTracks)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-pink-500 hover:bg-pink-400 font-semibold text-sm text-white shadow-lg shadow-pink-900/30 transition-colors"
                >
                  <Play className="w-4 h-4 fill-white text-white" />
                  Play All
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleShufflePlay}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 font-semibold text-sm text-white/70 hover:text-white transition-all"
                >
                  <Shuffle className="w-4 h-4" />
                  Shuffle
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="px-5 mt-4 space-y-0.5">
        {likedTracks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-24 gap-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <Heart className="w-9 h-9 text-white/15" />
            </div>
            <div className="text-center">
              <p className="text-white/50 font-semibold">No liked songs yet</p>
              <p className="text-white/25 text-sm mt-1">Tap the heart on any track to save it here</p>
            </div>
          </motion.div>
        ) : (
          likedTracks.map((track) => (
            <TrackCard key={track.id} track={track} queue={likedTracks} showSimilarButton />
          ))
        )}
      </div>
    </motion.div>
  )
}
