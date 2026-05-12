import { motion } from 'framer-motion'
import { Play, Heart } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import { usePlayerStore } from '@/store/playerStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { TrackCard } from '@/components/shared/TrackCard'

export default function FavoritesPage() {
  const { playTrack, toggleShuffle } = usePlayerStore()
  const { tracks: likedTracks } = useFavoritesStore()
  const totalDuration = likedTracks.reduce((acc, t) => acc + t.duration, 0)

  const handleShufflePlay = () => {
    if (likedTracks.length > 0) {
      toggleShuffle()
      const shuffled = [...likedTracks].sort(() => Math.random() - 0.5)
      playTrack(shuffled[0], shuffled)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="pb-32"
    >
      {/* Hero */}
      <div className="p-6 bg-gradient-to-b from-pink-900/20 to-transparent">
        <div className="flex items-end gap-6">
          <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-pink-400/30 to-violet-600/30 flex items-center justify-center shadow-2xl">
            <Heart className="w-16 h-16 fill-pink-400 text-pink-400" />
          </div>
          <div>
            <p className="text-xs text-[#94a3b8] uppercase tracking-widest mb-1">Playlist</p>
            <h1 className="text-3xl font-black text-[#f8fafc]">Liked Songs</h1>
            <p className="text-sm text-[#64748b] mt-1">
              {likedTracks.length} {likedTracks.length === 1 ? 'track' : 'tracks'}
              {likedTracks.length > 0 && ` · ${formatDuration(totalDuration)}`}
            </p>
            {likedTracks.length > 0 && (
              <button
                onClick={handleShufflePlay}
                className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-full bg-pink-500 hover:bg-pink-400 font-semibold text-sm transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                Shuffle play
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="px-6 mt-2 space-y-0.5">
        {likedTracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            queue={likedTracks}
          />
        ))}
        {likedTracks.length === 0 && (
          <div className="text-center py-20">
            <Heart className="w-14 h-14 text-[#64748b] mx-auto mb-4" />
            <p className="text-[#94a3b8] font-medium">No liked songs yet</p>
            <p className="text-[#64748b] text-sm mt-1">
              Tap the heart icon on any track to save it here.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
