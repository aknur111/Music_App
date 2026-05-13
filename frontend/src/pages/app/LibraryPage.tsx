import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, ListMusic, Lock } from 'lucide-react'
import { PlaylistService } from '@/services/playlist.service'
import type { Playlist } from '@/types'

export default function LibraryPage() {
  const navigate = useNavigate()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    PlaylistService.getUserPlaylists()
      .then(setPlaylists)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      const pl = await PlaylistService.createPlaylist({ name: name.trim(), description: description.trim() })
      setPlaylists((prev) => [pl, ...prev])
      setName('')
      setDescription('')
      setShowModal(false)
      navigate(`/playlists/${pl.id}`)
    } finally {
      setCreating(false)
    }
  }

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 pb-32"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Your Library</h1>
          <p className="text-white/40 text-sm mt-1">
            {loading ? 'Loading…' : `${playlists.length} playlist${playlists.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New playlist
        </motion.button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <ListMusic className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/40 text-sm">No playlists yet</p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold"
          >
            Create your first playlist
          </motion.button>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {playlists.map((pl) => (
            <motion.div
              key={pl.id}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              onClick={() => navigate(`/playlists/${pl.id}`)}
              className="group cursor-pointer bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] hover:border-violet-500/20 rounded-2xl p-4 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600/30 to-cyan-600/20 flex items-center justify-center flex-shrink-0 border border-white/[0.06] shadow-lg shadow-violet-900/10">
                  <ListMusic className="w-6 h-6 text-violet-400/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-white group-hover:text-violet-300 truncate transition-colors">
                      {pl.name}
                    </h3>
                    <Lock className="w-3 h-3 text-white/15 flex-shrink-0" />
                  </div>
                  {pl.description && (
                    <p className="text-xs text-white/35 mt-0.5 line-clamp-1">{pl.description}</p>
                  )}
                  <p className="text-xs text-white/20 mt-1">
                    {pl.trackIds.length > 0 ? `${pl.trackIds.length} tracks · ` : ''}
                    {new Date(pl.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-96 bg-[#13131f] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-5">Create Playlist</h3>
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Playlist name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 resize-none"
                />
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim() || creating}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Creating…' : 'Create'}
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
