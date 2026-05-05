import { motion } from 'framer-motion'
import { Play, Heart } from 'lucide-react'
import { DEMO_TRACKS } from '@/lib/constants'
import { formatDuration, formatCount } from '@/lib/utils'
import { usePlayerStore } from '@/store/playerStore'

export default function FavoritesPage() {
  const { playTrack, toggleShuffle } = usePlayerStore()
  const likedTracks = DEMO_TRACKS.filter((t) => t.isLiked)
  const totalDuration = likedTracks.reduce((acc, t) => acc + t.duration, 0)

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
          <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-pink-400/30 to-violet-600/30 flex items-center justify-center shadow-glass-lg">
            <Heart className="w-16 h-16 fill-pink-400 text-pink-400" />
          </div>
          <div>
            <p className="text-xs text-[#94a3b8] uppercase tracking-widest mb-1">Playlist</p>
            <h1 className="text-3xl font-black text-[#f8fafc]">Liked Songs</h1>
            <p className="text-sm text-[#64748b] mt-1">
              {likedTracks.length} tracks · {formatDuration(totalDuration)}
            </p>
            <button
              onClick={() => {
                if (likedTracks.length > 0) {
                  toggleShuffle()
                  const shuffled = [...likedTracks].sort(() => Math.random() - 0.5)
                  playTrack(shuffled[0], shuffled)
                }
              }}
              className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-full bg-pink-500 hover:bg-pink-400 font-semibold text-sm transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              Shuffle play
            </button>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="px-6 mt-2 space-y-1">
        {likedTracks.map((track, i) => (
          <div
            key={track.id}
            onClick={() => playTrack(track, likedTracks)}
            className="flex items-center gap-4 px-4 py-2.5 rounded-xl hover:bg-white/4 transition-colors group cursor-pointer"
          >
            <span className="w-5 text-right text-sm text-[#64748b] font-mono group-hover:hidden">
              {i + 1}
            </span>
            <button className="hidden group-hover:flex" onClick={(e) => { e.stopPropagation(); playTrack(track, likedTracks) }}>
              <Play className="w-4 h-4 fill-violet-400 text-violet-400" />
            </button>
            <img src={track.coverUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#f8fafc] truncate">{track.title}</p>
              <p className="text-xs text-[#94a3b8]">{track.artist}</p>
            </div>
            <span className="text-xs text-[#64748b]">{track.album}</span>
            <span className="text-xs text-[#64748b]">{formatCount(track.playCount)}</span>
            <span className="text-xs text-[#64748b] tabular-nums">{formatDuration(track.duration)}</span>
            <Heart className="w-4 h-4 fill-pink-400 text-pink-400" />
          </div>
        ))}
        {likedTracks.length === 0 && (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 text-[#64748b] mx-auto mb-3" />
            <p className="text-[#94a3b8]">Songs you like will appear here.</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
