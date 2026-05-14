import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, ArrowLeft, ListMusic, Trash2, Pencil, Users } from 'lucide-react'
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
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // --- New state for Collaboration feature ---
  const [friendId, setFriendId] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    PlaylistService.getPlaylist(id)
        .then((pl) => { setPlaylist(pl); setEditName(pl.name); setEditDesc(pl.description ?? '') })
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

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !editName.trim()) return
    setSaving(true)
    try {
      const updated = await PlaylistService.updatePlaylist(id, editName.trim(), editDesc.trim())
      setPlaylist((prev) => prev ? { ...prev, name: updated.name, description: updated.description } : prev)
      setShowEdit(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!id || !window.confirm('Delete this playlist? This cannot be undone.')) return
    setDeleting(true)
    try {
      await PlaylistService.deletePlaylist(id)
      navigate('/library')
    } finally {
      setDeleting(false)
    }
  }

  // --- New handler for adding a collaborator ---
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !friendId.trim()) return

    setInviteLoading(true)
    try {
      await PlaylistService.addCollaborator(id, friendId.trim())
      setInviteSuccess(true)
      setFriendId('')
      // Hide the success message after 3 seconds
      setTimeout(() => setInviteSuccess(false), 3000)
    } catch (err) {
      console.error("Failed to add collaborator", err)
      alert("Failed to add collaborator. Ensure the User ID is correct.")
    } finally {
      setInviteLoading(false)
    }
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
            <div className="flex items-center justify-between mb-6">
              <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex items-center gap-2">
                <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setShowEdit(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? 'Deleting…' : 'Delete'}
                </motion.button>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-600/20 flex items-center justify-center border border-white/[0.08] shadow-2xl flex-shrink-0 mt-2">
                <ListMusic className="w-14 h-14 text-violet-400/50" />
              </div>
              <div className="pb-2 flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">Playlist</p>
                <h1 className="text-3xl font-black text-white mb-1">{playlist.name}</h1>
                {playlist.description && (
                    <p className="text-sm text-white/50 mb-2">{playlist.description}</p>
                )}
                <p className="text-sm text-white/30 mb-4">
                  {tracks.length} track{tracks.length !== 1 ? 's' : ''}
                  {' · '}
                  {new Date(playlist.createdAt).toLocaleDateString()}
                </p>

                <div className="flex items-center gap-4">
                  {tracks.length > 0 && (
                      <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => playTrack(tracks[0], tracks)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-900/40 transition-colors"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Play All
                      </motion.button>
                  )}

                  {/* --- Collaboration Invite UI --- */}
                  <form onSubmit={handleInvite} className="flex items-center gap-2">
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                          type="text"
                          value={friendId}
                          onChange={(e) => setFriendId(e.target.value)}
                          placeholder="Friend's User ID..."
                          className="w-48 bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 transition-colors"
                      />
                    </div>
                    <button
                        type="submit"
                        disabled={!friendId.trim() || inviteLoading}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
                    >
                      {inviteLoading ? '...' : 'Invite'}
                    </button>
                    {inviteSuccess && (
                        <span className="text-xs text-green-400 font-medium ml-2 animate-pulse">
                      Added!
                    </span>
                    )}
                  </form>
                </div>

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

        {/* Edit modal */}
        <AnimatePresence>
          {showEdit && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                  onClick={(e) => { if (e.target === e.currentTarget) setShowEdit(false) }}
              >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="w-96 bg-[#13131f] border border-white/10 rounded-2xl p-6 shadow-2xl"
                >
                  <h3 className="text-lg font-bold text-white mb-5">Edit Playlist</h3>
                  <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
                    <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Playlist name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60"
                    />
                    <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Description (optional)"
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 resize-none"
                    />
                    <div className="flex gap-2 justify-end mt-2">
                      <button
                          type="button"
                          onClick={() => setShowEdit(false)}
                          className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                          type="submit"
                          disabled={!editName.trim() || saving}
                          className="px-5 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
  )
}