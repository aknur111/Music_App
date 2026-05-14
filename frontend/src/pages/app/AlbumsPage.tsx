import { useState, useEffect, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Play,
  Disc3,
  Plus,
  X,
  LoaderCircle,
} from 'lucide-react'
import { MusicService } from '@/services'
import type { Album, Artist } from '@/types'

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const card = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
}

export default function AlbumsPage() {
  const navigate = useNavigate()

  const [albums, setAlbums] = useState<Album[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [form, setForm] = useState({
    title: '',
    artist_id: '',
    year: String(new Date().getFullYear()),
  })

  useEffect(() => {
    async function loadPage() {
      setLoading(true)

      const [albumsResult, artistsResult] = await Promise.allSettled([
        MusicService.getAlbums(),
        MusicService.getArtists(),
      ])

      if (albumsResult.status === 'fulfilled') {
        setAlbums(albumsResult.value)
      }

      if (artistsResult.status === 'fulfilled') {
        setArtists(artistsResult.value)
      }

      setLoading(false)
    }

    loadPage()
  }, [])

  const resetCreateForm = () => {
    setForm({
      title: '',
      artist_id: '',
      year: String(new Date().getFullYear()),
    })
    setCreateError('')
    setCreating(false)
  }

  const closeCreateModal = () => {
    setCreateOpen(false)
    resetCreateForm()
  }

  const handleCreateAlbum = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreateError('')

    const title = form.title.trim()
    const year = Number(form.year)

    if (!title) {
      setCreateError('Album title is required.')
      return
    }

    if (!form.artist_id) {
      setCreateError('Please select an artist.')
      return
    }

    if (!Number.isInteger(year) || year < 1800 || year > 2100) {
      setCreateError('Please enter a valid release year.')
      return
    }

    setCreating(true)

    try {
      const createdAlbum = await MusicService.createAlbum({
        title,
        artist_id: form.artist_id,
        year,
      })

      const selectedArtist = artists.find(
        (artist) => artist.id === form.artist_id,
      )

      const albumForUi: Album = {
        ...createdAlbum,
        artist:
          selectedArtist?.name ||
          createdAlbum.artist ||
          'Unknown Artist',
      }

      setAlbums((prev) => [albumForUi, ...prev])
      closeCreateModal()
    } catch (error) {
      console.error('Create album failed:', error)
      setCreateError('Failed to create album. Please try again.')
      setCreating(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="p-6 pb-32"
      >
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Albums
            </h1>

            <p className="text-white/40 text-sm mt-0.5">
              {loading ? '…' : `${albums.length} releases`}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-900/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Album
          </motion.button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square rounded-2xl bg-white/[0.05] animate-pulse" />
                <div className="h-3.5 w-3/4 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-white/[0.04] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"
          >
            {albums.map((album) => (
              <motion.div
                key={album.id}
                variants={card}
                whileHover={{ y: -4 }}
                className="group cursor-pointer"
                onClick={() => navigate(`/albums/${album.id}`)}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-white/[0.04] shadow-lg">
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-cyan-900/30 flex items-center justify-center">
                      <Disc3 className="w-12 h-12 text-violet-400/30" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-violet-600 shadow-lg shadow-violet-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                  </motion.div>
                </div>

                <p className="text-sm font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
                  {album.title}
                </p>

                <p className="text-xs text-white/40 mt-0.5 truncate">
                  {album.artist}
                </p>

                <p className="text-xs text-white/25 mt-0.5">
                  {album.releaseYear} · {album.trackCount} tracks
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {createOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
            onMouseDown={closeCreateModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 28,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-[#13131f] border border-white/[0.08] shadow-2xl shadow-black/70 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Create Album
                  </h2>
                  <p className="text-sm text-white/40 mt-0.5">
                    Add a new release to the catalog
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={handleCreateAlbum}
                className="p-6 space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Album title
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Dawn FM"
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Artist
                  </label>

                  <select
                    value={form.artist_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        artist_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                  >
                    <option value="" className="bg-[#13131f]">
                      Select artist
                    </option>

                    {artists.map((artist) => (
                      <option
                        key={artist.id}
                        value={artist.id}
                        className="bg-[#13131f]"
                      >
                        {artist.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Release year
                  </label>

                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        year: e.target.value,
                      }))
                    }
                    min={1800}
                    max={2100}
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                  />
                </div>

                {createError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {createError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creating || artists.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                  >
                    {creating && (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    )}
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}