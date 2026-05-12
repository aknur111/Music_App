import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, ArrowLeft, ListMusic, Trash2 } from 'lucide-react'
import { PlaylistService } from '@/services/playlist.service'
import { TrackCard } from '@/components/shared/TrackCard'
import { usePlayerStore } from '@/store/playerStore'
import type { Playlist } from '@/types'

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { playTrack, addToQueue } = usePlayerStore()

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    PlaylistService.getPlaylist(id)
      .then(setPlaylist)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  async function handleRemoveTrack(trackId: string) {
    if (!id) return
    await PlaylistService.removeTrack(id, trackId)
    setPlaylist((prev) =>
      prev
        ? {
            ...prev,
            tracks: (prev.tracks ?? []).filter((t) => t.id !== trackId),
            trackIds: prev.trackIds.filter((tid) => tid !== trackId),
          }
        : prev
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !playlist) {
    return (
      <div className="p-6 text-center py-24">
        <p className="text-white/40 mb-4">Playlist not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-violet-400 hover:text-violet-300"
        >
          Go back
        </button>
      </div>
    )
  }

  const tracks = playlist.tracks ?? []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-900/30 to-cyan-900/20 border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d0d1a]/80 pointer-events-none" />
        <div className="relative z-10 p-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-end gap-6">
            <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-600/20 flex items-center justify-center border border-white/[0.08] shadow-2xl flex-shrink-0">
              <ListMusic className="w-14 h-14 text-violet-400/50" />
            </div>
            <div className="pb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">Playlist</p>
              <h1 className="text-3xl font-black text-white mb-1">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-sm text-white/50 mb-2">{playlist.description}</p>
              )}
              <p className="text-sm text-white/30">
                {tracks.length} track{tracks.length !== 1 ? 's' : ''}
                {' · '}
                {new Date(playlist.createdAt).toLocaleDateString()}
              </p>

              {tracks.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => playTrack(tracks[0], tracks)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-900/40 transition-colors mt-4"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Play All
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="px-4 pt-4">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <ListMusic className="w-10 h-10 text-white/15" />
            <p className="text-white/40 text-sm">No tracks in this playlist yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {tracks.map((track, i) => (
              <div key={track.id} className="group flex items-center">
                <div className="flex-1 min-w-0">
                  <TrackCard
                    track={track}
                    queue={tracks}
                    index={i}
                    showIndex
                    onAddToQueue={(t) => addToQueue(t)}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRemoveTrack(track.id)}
                  className="opacity-0 group-hover:opacity-100 ml-2 p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                  title="Remove from playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
