import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, Disc3 } from 'lucide-react'
import { MusicService } from '@/services'
import type { Album } from '@/types'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const card = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } }

export default function AlbumsPage() {
  const navigate = useNavigate()
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    MusicService.getAlbums().then(setAlbums).finally(() => setLoading(false))
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="p-6 pb-32"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Albums</h1>
        <p className="text-white/40 text-sm mt-0.5">{loading ? '…' : `${albums.length} releases`}</p>
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
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1, opacity: 1 }}
                  className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-violet-600 shadow-lg shadow-violet-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                </motion.div>
              </div>
              <p className="text-sm font-semibold text-white truncate group-hover:text-violet-300 transition-colors">{album.title}</p>
              <p className="text-xs text-white/40 mt-0.5 truncate">{album.artist}</p>
              <p className="text-xs text-white/25 mt-0.5">{album.releaseYear} · {album.trackCount} tracks</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
