import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, TrendingUp, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MusicService } from '@/services'
import { formatDuration, formatCount } from '@/lib/utils'
import { usePlayerStore } from '@/store/playerStore'
import type { Track, Album, Artist } from '@/types'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0 },
}

export default function HomePage() {
  const navigate = useNavigate()
  const { playTrack } = usePlayerStore()
  const [tracks, setTracks] = useState<Track[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      MusicService.getTracks(1, 20),
      MusicService.getAlbums(),
      MusicService.getArtists(),
    ]).then(([t, al, ar]) => {
      setTracks(t)
      setAlbums(al)
      setArtists(ar)
    }).finally(() => setLoading(false))
  }, [])

  const topTracks = tracks.slice(0, 6)

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (topTracks.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center py-24">
        <p className="text-[#64748b]">No music available right now.</p>
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
      <motion.section variants={itemVariants}>
        <h1 className="text-3xl font-bold text-[#f8fafc] mb-1">Good evening</h1>
        <p className="text-[#94a3b8]">Here's what's trending right now</p>
      </motion.section>

      <motion.section variants={itemVariants}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900/60 to-cyan-900/40 p-8 border border-white/8">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex items-center gap-6">
            <img
              src={topTracks[0].coverUrl}
              alt={topTracks[0].title}
              className="w-24 h-24 rounded-2xl object-cover shadow-glass-lg"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-violet-300 font-medium mb-1 uppercase tracking-wider">
                Featured
              </div>
              <h2 className="text-2xl font-bold text-[#f8fafc] truncate">{topTracks[0].title}</h2>
              <p className="text-[#94a3b8] mt-0.5">{topTracks[0].artist}</p>
              <p className="text-sm text-[#64748b] mt-1">
                {topTracks[0].album}
              </p>
            </div>
            <button
              onClick={() => playTrack(topTracks[0], topTracks)}
              className="flex-shrink-0 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center shadow-glow transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-6 h-6 fill-white text-white ml-0.5" />
            </button>
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          <h2 className="text-lg font-semibold text-[#f8fafc]">Trending Now</h2>
        </div>
        <div className="space-y-2">
          {topTracks.map((track, i) => (
            <div
              key={track.id}
              onClick={() => playTrack(track, topTracks)}
              className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/4 transition-colors group cursor-pointer"
            >
              <span className="w-5 text-right text-sm text-[#64748b] font-mono">{i + 1}</span>
              <img
                src={track.coverUrl}
                alt={track.title}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#f8fafc] truncate">{track.title}</p>
                <p className="text-xs text-[#94a3b8]">{track.artist}</p>
              </div>
              <span className="text-xs text-[#64748b]">{formatCount(track.playCount)}</span>
              <span className="text-xs text-[#64748b] tabular-nums">
                {formatDuration(track.duration)}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); playTrack(track, topTracks) }}
                className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-violet-600/80 flex items-center justify-center transition-opacity"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </motion.section>

      {albums.length > 0 && (
        <motion.section variants={itemVariants}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-semibold text-[#f8fafc]">New Releases</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {albums.slice(0, 5).map((album) => (
              <div key={album.id} className="group cursor-pointer" onClick={() => navigate(`/albums/${album.id}`)}>
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center">
                      <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-medium text-[#f8fafc] truncate">{album.title}</p>
                <p className="text-xs text-[#94a3b8]">{album.artist} · {album.releaseYear}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {artists.length > 0 && (
        <motion.section variants={itemVariants}>
          <h2 className="text-lg font-semibold text-[#f8fafc] mb-4">Artists You Might Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {artists.slice(0, 5).map((artist) => (
              <div key={artist.id} className="group cursor-pointer text-center">
                <div className="relative w-full aspect-square rounded-full overflow-hidden mb-3 mx-auto max-w-[120px]">
                  <img
                    src={artist.avatarUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-sm font-medium text-[#f8fafc] truncate">{artist.name}</p>
                <p className="text-xs text-[#94a3b8]">{artist.genre}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  )
}
