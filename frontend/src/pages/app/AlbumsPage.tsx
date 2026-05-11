import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { MusicService } from '@/services'
import type { Album } from '@/types'

export default function AlbumsPage() {
  const navigate = useNavigate()
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    MusicService.getAlbums().then(setAlbums).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-6 pb-32"
    >
      <h1 className="text-2xl font-bold text-[#f8fafc] mb-6">Albums</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {albums.map((album) => (
          <div
            key={album.id}
            className="group cursor-pointer"
            onClick={() => navigate(`/albums/${album.id}`)}
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
              <img
                src={album.coverUrl}
                alt={album.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center shadow-glow">
                  <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                </button>
              </div>
            </div>
            <p className="text-sm font-semibold text-[#f8fafc] truncate">{album.title}</p>
            <p className="text-xs text-[#94a3b8] mt-0.5">{album.artist}</p>
            <p className="text-xs text-[#64748b]">{album.releaseYear} · {album.trackCount} tracks</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
