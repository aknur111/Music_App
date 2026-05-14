import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, ArrowLeft, Clock, Pause, Heart, ListPlus } from 'lucide-react'
import { MusicService } from '@/services'
import { formatDuration, formatCount, cn } from '@/lib/utils'
import { usePlayerStore } from '@/store/playerStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { AddToPlaylistModal } from '@/components/shared/AddToPlaylistModal'
import type { Album, Track } from '@/types'

export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { playTrack, currentTrack, isPlaying } = usePlayerStore()
  const { isLiked, toggle: toggleFav } = useFavoritesStore()
  const [album, setAlbum] = useState<Album | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [playlistTrack, setPlaylistTrack] = useState<Track | null>(null)

  useEffect(() => {
    if (!id) return

    const albumId = id

    async function loadAlbumPage() {
      setLoading(true)

      try {
        const albumData = await MusicService.getAlbum(albumId)
        setAlbum(albumData)

        try {
          const albumTracks = await MusicService.getAlbumTracks(albumId)
          setTracks(albumTracks)
        } catch {
          setTracks(albumData.tracks ?? [])
        }
      } catch {
        setAlbum(null)
        setTracks([])
      } finally {
        setLoading(false)
      }
    }

    loadAlbumPage()
  }, [id])

  if (loading) {
    return (
      <div className="pb-32">
        <div className="p-6 h-64 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="p-6 text-center py-24">
        <p className="text-white/40 mb-4">Album not found.</p>
        <button onClick={() => navigate(-1)} className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
          ← Go back
        </button>
      </div>
    )
  }

  const totalDuration = tracks.reduce((acc, t) => acc + t.duration, 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="pb-32">
      {/* Blurred bg */}
      <div className="relative overflow-hidden">
        {album.coverUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110"
            style={{ backgroundImage: `url(${album.coverUrl})`, filter: 'blur(60px) brightness(0.25) saturate(1.5)' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0d1a]/50 to-[#0d0d1a]" />

        <div className="relative z-10 p-6 pt-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-end gap-7">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="flex-shrink-0"
            >
              <img
                src={album.coverUrl}
                alt={album.title}
                className="w-44 h-44 rounded-2xl object-cover shadow-2xl shadow-black/50"
              />
            </motion.div>

            <div className="pb-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Album</p>
              <h1 className="text-4xl font-black text-white tracking-tight truncate mb-1">{album.title}</h1>
              <p className="text-white/60 font-medium">{album.artist}</p>
              <div className="flex items-center gap-2 mt-1.5 text-sm text-white/30">
                <span>{album.releaseYear}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{tracks.length} tracks</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDuration(totalDuration)}</span>
              </div>

              <div className="flex items-center gap-3 mt-5">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => tracks.length > 0 && playTrack(tracks[0], tracks)}
                  disabled={tracks.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 font-semibold text-sm text-white shadow-lg shadow-violet-900/40 transition-colors disabled:opacity-40"
                >
                  <Play className="w-4 h-4 fill-white text-white" />
                  Play All
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="px-5 mt-2">
        <div className="grid grid-cols-[2.5rem_1fr_5rem_3.5rem_2.5rem] gap-3 px-3 pb-2.5 text-[11px] text-white/25 font-semibold uppercase tracking-wider border-b border-white/[0.05]">
          <span className="text-center">#</span>
          <span>Title</span>
          <span className="text-right">Plays</span>
          <span className="flex justify-end items-center"><Clock className="w-3.5 h-3.5" /></span>
          <span />
        </div>

        {tracks.length === 0 ? (
          <p className="text-center text-white/25 py-12 text-sm">No tracks available yet.</p>
        ) : (
          <div className="mt-1 space-y-0.5">
            {tracks.map((track, i) => {
              const isActive = currentTrack?.id === track.id
              const liked = isLiked(track.id)
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, tracks)}
                  className={cn(
                    'grid grid-cols-[2.5rem_1fr_5rem_3.5rem_2.5rem] gap-3 px-3 py-3 rounded-xl transition-all duration-150 group cursor-pointer items-center',
                    isActive ? 'bg-violet-500/10 border border-violet-500/15' : 'hover:bg-white/[0.04] border border-transparent',
                  )}
                >
                  <div className="flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {isActive && isPlaying ? (
                        <motion.div key="bars" className="flex items-end gap-[2px] h-4">
                          {[1, 2, 3].map((b) => (
                            <motion.span key={b} className="w-[3px] bg-violet-400 rounded-full" animate={{ height: ['6px', '14px', '6px'] }} transition={{ duration: 0.5 + b * 0.1, repeat: Infinity, ease: 'easeInOut' }} style={{ height: '6px' }} />
                          ))}
                        </motion.div>
                      ) : isActive ? (
                        <motion.span key="pause" className={cn('text-sm font-mono', isActive ? 'text-violet-400' : 'text-white/30')}>
                          <Pause className="w-3.5 h-3.5 fill-violet-400 text-violet-400" />
                        </motion.span>
                      ) : (
                        <motion.span key="idx">
                          <span className="text-sm text-white/30 font-mono group-hover:hidden">{i + 1}</span>
                          <Play className="w-3.5 h-3.5 fill-white text-white hidden group-hover:block" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium truncate', isActive ? 'text-violet-300' : 'text-white')}>{track.title}</p>
                    <p className="text-xs text-white/35 truncate">{track.artist}</p>
                  </div>
                  <p className="text-sm text-white/30 text-right tabular-nums">{formatCount(track.playCount)}</p>
                  <p className="text-sm text-white/30 text-right tabular-nums">{formatDuration(track.duration)}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setPlaylistTrack(track) }} className="w-5 h-5 flex items-center justify-center text-white/30 hover:text-violet-400 transition-colors">
                      <ListPlus className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleFav(track) }} className="w-5 h-5 flex items-center justify-center">
                      <Heart className={cn('w-3.5 h-3.5 transition-colors', liked ? 'fill-pink-400 text-pink-400' : 'text-white/30 hover:text-pink-400')} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AddToPlaylistModal track={playlistTrack} onClose={() => setPlaylistTrack(null)} />
    </motion.div>
  )
}
