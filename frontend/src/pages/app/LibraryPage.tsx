import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Lock, Globe } from 'lucide-react'
import { MOCK_PLAYLISTS } from '@/lib/mockData'
import { formatCount } from '@/lib/utils'

export default function LibraryPage() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-6 pb-32"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#f8fafc]">Your Library</h1>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 transition-colors">
          <Plus className="w-4 h-4" />
          New playlist
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_PLAYLISTS.map((playlist) => (
          <div
            key={playlist.id}
            className="glass rounded-2xl overflow-hidden hover:bg-white/6 transition-colors cursor-pointer group"
            onClick={() => navigate(`/playlists/${playlist.id}`)}
          >
            <div className="aspect-video overflow-hidden">
              <img
                src={playlist.coverUrl}
                alt={playlist.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#f8fafc] truncate">{playlist.name}</h3>
                  {playlist.description && (
                    <p className="text-xs text-[#94a3b8] mt-0.5 line-clamp-1">{playlist.description}</p>
                  )}
                </div>
                {playlist.isPublic
                  ? <Globe className="w-4 h-4 text-[#64748b] flex-shrink-0 mt-0.5" />
                  : <Lock className="w-4 h-4 text-[#64748b] flex-shrink-0 mt-0.5" />
                }
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-[#64748b]">
                <span>{(playlist.tracks?.length ?? playlist.trackIds.length)} tracks</span>
                {playlist.followerCount > 0 && (
                  <>
                    <span>·</span>
                    <span>{formatCount(playlist.followerCount)} followers</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
