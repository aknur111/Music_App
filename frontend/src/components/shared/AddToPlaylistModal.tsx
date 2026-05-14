import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ListMusic, Plus, Check } from 'lucide-react'
import { PlaylistService } from '@/services/playlist.service'
import type { Playlist, Track } from '@/types'

interface Props {
  track: Track | null
  onClose: () => void
}

export function AddToPlaylistModal({ track, onClose }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [createMode, setCreateMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!track) return
    PlaylistService.getUserPlaylists()
        .then((pls) => {
          setPlaylists(pls)

          // 🚀 FIX: Pre-populate 'added' set if the track is already in the playlist
          // This prevents the user from trying to add a duplicate!
          const alreadyInPlaylists = pls
              .filter(p => p.trackIds && p.trackIds.includes(track.id))
              .map(p => p.id)

          setAdded(new Set(alreadyInPlaylists))
        })
        .finally(() => setLoading(false))
  }, [track])

  useEffect(() => {
    if (!track) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [track, onClose])

  async function handleAdd(playlistId: string) {
    if (!track || added.has(playlistId)) return
    setAdding(playlistId)
    try {
      await PlaylistService.addTrack(playlistId, track)
      setAdded((prev) => new Set([...prev, playlistId]))
    } catch (error: any) {
      // 🚀 FIX: Do not silently ignore errors.
      console.error("Failed to add track:", error)
      const errorMsg = error?.response?.data?.error || "Failed to add track."
      alert(`Error: ${errorMsg}`) // Show the error to the user so you know what failed
    } finally {
      setAdding(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !track) return
    setCreating(true)
    try {
      const pl = await PlaylistService.createPlaylist({ name: newName.trim() })
      await PlaylistService.addTrack(pl.id, track)
      setPlaylists((prev) => [pl, ...prev])
      setAdded((prev) => new Set([...prev, pl.id]))
      setNewName('')
      setCreateMode(false)
    } catch (error: any) {
      console.error("Failed to create playlist:", error)
      alert("Error creating playlist. See console.")
    } finally {
      setCreating(false)
    }
  }

  if (!track) return null

  return (
      <AnimatePresence>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-80 bg-[#13131f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Add to Playlist</h3>
                <p className="text-xs text-white/40 mt-0.5 truncate max-w-[200px]">{track.title}</p>
              </div>
              <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Create new playlist row */}
            <div className="px-3 pb-2">
              {createMode ? (
                  <form onSubmit={handleCreate} className="flex gap-2">
                    <input
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Playlist name…"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60"
                    />
                    <button
                        type="submit"
                        disabled={!newName.trim() || creating}
                        className="px-3 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
                    >
                      {creating ? '…' : 'Create'}
                    </button>
                  </form>
              ) : (
                  <button
                      onClick={() => setCreateMode(true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    <Plus className="w-4 h-4 text-violet-400" />
                    New playlist
                  </button>
              )}
            </div>

            <div className="h-px bg-white/[0.06] mx-3" />

            {/* Playlist list */}
            <div className="max-h-60 overflow-y-auto py-2 px-3">
              {loading ? (
                  <div className="space-y-2 py-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
              ) : playlists.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-6">No playlists yet</p>
              ) : (
                  playlists.map((pl) => {
                    const isDone = added.has(pl.id)
                    const isLoading = adding === pl.id
                    return (
                        <button
                            key={pl.id}
                            onClick={() => handleAdd(pl.id)}
                            disabled={isLoading || isDone}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group disabled:opacity-80 disabled:cursor-not-allowed"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/30 to-cyan-600/20 flex items-center justify-center flex-shrink-0">
                            <ListMusic className="w-3.5 h-3.5 text-violet-400/60" />
                          </div>
                          <span className="flex-1 text-sm text-white/70 group-hover:text-white text-left truncate transition-colors">
                      {pl.name}
                    </span>
                          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {isLoading ? (
                                <div className="w-3.5 h-3.5 rounded-full border border-violet-400 border-t-transparent animate-spin" />
                            ) : isDone ? (
                                <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : null}
                          </div>
                        </button>
                    )
                  })
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
  )
}