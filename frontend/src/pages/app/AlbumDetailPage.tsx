import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, ArrowLeft, Clock } from 'lucide-react'
import { MusicService } from '@/services'
import { formatDuration, formatCount } from '@/lib/utils'
import { usePlayerStore } from '@/store/playerStore'
import type { Album } from '@/types'

export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { playTrack } = usePlayerStore()
  const [album, setAlbum] = useState<Album | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    MusicService.getAlbum(id)
      .then(setAlbum)
      .catch(() => setAlbum(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!album) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#94a3b8]">Album not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-violet-400 hover:text-violet-300">
          Go back
        </button>
      </div>
    )
  }

  const tracks = album.tracks ?? []
  const totalDuration = tracks.reduce((acc, t) => acc + t.duration, 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32">
      <div className="relative">
        <div
          className="absolute inset-0 h-64 bg-cover bg-center blur-2xl opacity-20"
          style={{ backgroundImage: `url(${album.coverUrl})` }}
        />
        <div className="relative z-10 p-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-[#94a3b8] hover:text-[#f8fafc] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-end gap-6">
            <img
              src={album.coverUrl}
              alt={album.title}
              className="w-40 h-40 rounded-2xl object-cover shadow-glass-lg"
            />
            <div>
              <p className="text-xs text-[#94a3b8] uppercase tracking-widest mb-1">Album</p>
              <h1 className="text-3xl font-black text-[#f8fafc] mb-1">{album.title}</h1>
              <p className="text-[#94a3b8]">{album.artist}</p>
              <p className="text-sm text-[#64748b] mt-1">
                {album.releaseYear} · {tracks.length} tracks · {formatDuration(totalDuration)}
              </p>
              <button
                onClick={() => tracks.length > 0 && playTrack(tracks[0], tracks)}
                className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 font-semibold text-sm transition-all shadow-glow active:scale-95"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                Play all
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-4">
        <div className="grid grid-cols-[2rem_1fr_5rem_3rem] gap-4 px-4 text-xs text-[#64748b] font-medium uppercase tracking-wide border-b border-white/8 pb-2 mb-2">
          <span>#</span>
          <span>Title</span>
          <span className="text-right">Plays</span>
          <span className="flex justify-end"><Clock className="w-3.5 h-3.5" /></span>
        </div>
        {tracks.length > 0 ? tracks.map((track, i) => (
          <div
            key={track.id}
            onClick={() => playTrack(track, tracks)}
            className="grid grid-cols-[2rem_1fr_5rem_3rem] gap-4 px-4 py-2.5 rounded-xl hover:bg-white/4 transition-colors group cursor-pointer items-center"
          >
            <span className="text-sm text-[#64748b] font-mono text-right group-hover:hidden">
              {i + 1}
            </span>
            <button
              className="hidden group-hover:flex items-center justify-end"
              onClick={(e) => { e.stopPropagation(); playTrack(track, tracks) }}
            >
              <Play className="w-4 h-4 fill-violet-400 text-violet-400" />
            </button>
            <div>
              <p className="text-sm font-medium text-[#f8fafc]">{track.title}</p>
              <p className="text-xs text-[#94a3b8]">{track.artist}</p>
            </div>
            <p className="text-sm text-[#64748b] text-right">{formatCount(track.playCount)}</p>
            <p className="text-sm text-[#64748b] text-right tabular-nums">{formatDuration(track.duration)}</p>
          </div>
        )) : (
          <p className="text-center text-[#64748b] py-8">No tracks available for this album yet.</p>
        )}
      </div>
    </motion.div>
  )
}
