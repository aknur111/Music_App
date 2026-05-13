import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Heart, Search, Music2, ListPlus } from 'lucide-react'
import { MusicService } from '@/services'
import { formatDuration, formatCount, cn } from '@/lib/utils'
import { usePlayerStore } from '@/store/playerStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { AddToPlaylistModal } from '@/components/shared/AddToPlaylistModal'
import type { Track } from '@/types'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } }
const row = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

export default function TracksPage() {
  const { playTrack, currentTrack, isPlaying } = usePlayerStore()
  const { isLiked, toggle: toggleFav } = useFavoritesStore()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [playlistTrack, setPlaylistTrack] = useState<Track | null>(null)

  useEffect(() => {
    MusicService.getTracks(1, 50).then(setTracks).finally(() => setLoading(false))
  }, [])

  const filtered = tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="p-6 pb-32 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Tracks</h1>
          <p className="text-white/40 text-sm mt-0.5">{tracks.length} songs from Jamendo</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="pl-10 pr-4 py-2.5 rounded-2xl text-sm text-white w-52 bg-white/[0.06] border border-white/[0.08] placeholder-white/25 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2.5rem_1fr_1fr_5rem_4rem_3rem] gap-4 px-3 text-[11px] text-white/25 font-semibold uppercase tracking-wider border-b border-white/[0.05] pb-2.5">
        <span className="text-center">#</span>
        <span>Title</span>
        <span>Album</span>
        <span className="text-right">Plays</span>
        <span className="text-right">Time</span>
        <span />
      </div>

      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-0.5">
          {filtered.map((track, i) => {
            const isActive = currentTrack?.id === track.id
            const liked = isLiked(track.id)
            return (
              <motion.div
                key={track.id}
                variants={row}
                onClick={() => playTrack(track, filtered)}
                className={cn(
                  'grid grid-cols-[2.5rem_1fr_1fr_5rem_4rem_3rem] gap-4 px-3 py-2.5 rounded-xl transition-all duration-150 group cursor-pointer items-center',
                  isActive ? 'bg-violet-500/10 border border-violet-500/15' : 'hover:bg-white/[0.04] border border-transparent',
                )}
              >
                {/* Index / play */}
                <div className="flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {isActive && isPlaying ? (
                      <motion.div key="bars" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-end gap-[2px] h-4">
                        {[1, 2, 3].map((b) => (
                          <motion.span key={b} className="w-[3px] bg-violet-400 rounded-full" animate={{ height: ['8px', '16px', '8px'] }} transition={{ duration: 0.6 + b * 0.1, repeat: Infinity, ease: 'easeInOut' }} style={{ height: '8px' }} />
                        ))}
                      </motion.div>
                    ) : (
                      <motion.span key="num" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <span className="text-sm text-white/30 font-mono group-hover:hidden">{i + 1}</span>
                        <Play className="w-3.5 h-3.5 fill-white text-white hidden group-hover:block" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Cover + title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-9 h-9 flex-shrink-0 rounded-lg overflow-hidden">
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-violet-900/30 flex items-center justify-center">
                        <Music2 className="w-4 h-4 text-violet-400/50" />
                      </div>
                    )}
                    {isActive && <div className="absolute inset-0 bg-violet-600/20" />}
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium truncate transition-colors', isActive ? 'text-violet-300' : 'text-white')}>{track.title}</p>
                    <p className="text-xs text-white/40 truncate">{track.artist}</p>
                  </div>
                </div>

                <p className="text-sm text-white/35 truncate">{track.album}</p>
                <p className="text-sm text-white/30 text-right tabular-nums">{formatCount(track.playCount)}</p>
                <p className="text-sm text-white/30 text-right tabular-nums">{formatDuration(track.duration)}</p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPlaylistTrack(track) }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-white/30 hover:text-violet-400 hover:bg-white/5 transition-all"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFav(track) }}
                    className={cn('w-6 h-6 flex items-center justify-center rounded-md transition-all', liked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}
                  >
                    <Heart className={cn('w-3.5 h-3.5 transition-colors', liked ? 'fill-pink-400 text-pink-400' : 'text-white/30 hover:text-pink-400')} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="flex flex-col items-center py-20 gap-3">
          <Music2 className="w-12 h-12 text-white/10" />
          <p className="text-white/30 text-sm">No tracks match your search</p>
        </div>
      )}

      <AddToPlaylistModal track={playlistTrack} onClose={() => setPlaylistTrack(null)} />
    </motion.div>
  )
}
