import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, ArrowLeft, Lock, Globe } from 'lucide-react'
import { MOCK_PLAYLISTS } from '@/lib/mockData'
import { formatDuration, formatCount } from '@/lib/utils'
import { usePlayerStore } from '@/store/playerStore'

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { playTrack } = usePlayerStore()
  const playlist = MOCK_PLAYLISTS.find((p) => p.id === id)

  if (!playlist) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#94a3b8]">Playlist not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-violet-400 hover:text-violet-300">
          Go back
        </button>
      </div>
    )
  }

  const tracks = playlist.tracks ?? []
  const totalDuration = tracks.reduce((acc, t) => acc + t.duration, 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32">
      <div className="relative">
        <div
          className="absolute inset-0 h-64 bg-cover bg-center blur-2xl opacity-20"
          style={{ backgroundImage: `url(${playlist.coverUrl})` }}
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
              src={playlist.coverUrl}
              alt={playlist.name}
              className="w-40 h-40 rounded-2xl object-cover shadow-glass-lg"
            />
            <div>
              <p className="text-xs text-[#94a3b8] uppercase tracking-widest mb-1">Playlist</p>
              <h1 className="text-3xl font-black text-[#f8fafc] mb-1">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-sm text-[#94a3b8] mb-1">{playlist.description}</p>
              )}
              <div className="flex items-center gap-3 text-sm text-[#64748b]">
                <span>{playlist.ownerName ?? 'Unknown'}</span>
                <span>·</span>
                <span>{tracks.length} tracks · {formatDuration(totalDuration)}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  {playlist.isPublic
                    ? <><Globe className="w-3.5 h-3.5" /> Public</>
                    : <><Lock className="w-3.5 h-3.5" /> Private</>
                  }
                </span>
              </div>
              <button
                onClick={() => tracks.length > 0 && playTrack(tracks[0], tracks)}
                className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 font-semibold text-sm transition-all shadow-glow active:scale-95"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                Play
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-4 space-y-1">
        {tracks.map((track, i) => (
          <div
            key={track.id}
            onClick={() => playTrack(track, tracks)}
            className="flex items-center gap-4 px-4 py-2.5 rounded-xl hover:bg-white/4 transition-colors group cursor-pointer"
          >
            <span className="w-5 text-right text-sm text-[#64748b] font-mono group-hover:hidden">{i + 1}</span>
            <button className="hidden group-hover:flex" onClick={(e) => { e.stopPropagation(); playTrack(track, tracks) }}>
              <Play className="w-4 h-4 fill-violet-400 text-violet-400" />
            </button>
            <img src={track.coverUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#f8fafc] truncate">{track.title}</p>
              <p className="text-xs text-[#94a3b8]">{track.artist}</p>
            </div>
            <span className="text-xs text-[#64748b]">{formatCount(track.playCount)}</span>
            <span className="text-xs text-[#64748b] tabular-nums">{formatDuration(track.duration)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
