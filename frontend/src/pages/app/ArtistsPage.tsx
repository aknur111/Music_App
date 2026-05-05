import { motion } from 'framer-motion'
import { UserCheck, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { DEMO_ARTISTS } from '@/lib/constants'
import { formatCount, cn } from '@/lib/utils'

export default function ArtistsPage() {
  const [followedIds, setFollowedIds] = useState<Set<string>>(
    () => new Set(DEMO_ARTISTS.filter((a) => a.isFollowed).map((a) => a.id)),
  )

  const toggle = (id: string) =>
    setFollowedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-6 pb-32"
    >
      <h1 className="text-2xl font-bold text-[#f8fafc] mb-6">Artists</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_ARTISTS.map((artist) => (
          <div
            key={artist.id}
            className="glass rounded-2xl overflow-hidden hover:bg-white/6 transition-colors cursor-pointer group"
          >
            {/* Cover banner */}
            <div className="h-24 overflow-hidden">
              <img
                src={artist.coverUrl ?? artist.avatarUrl}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="px-5 pb-5">
              {/* Avatar */}
              <div className="-mt-8 mb-3">
                <img
                  src={artist.avatarUrl}
                  alt={artist.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#06060e]"
                />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#f8fafc] truncate">{artist.name}</h3>
                  <p className="text-xs text-[#94a3b8]">{artist.genre}</p>
                  <p className="text-xs text-[#64748b] mt-1">
                    {formatCount(artist.followerCount)} followers · {artist.albumCount} albums
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(artist.id)
                  }}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    followedIds.has(artist.id)
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                      : 'bg-white/5 text-[#94a3b8] border border-white/8 hover:border-violet-500/40',
                  )}
                >
                  {followedIds.has(artist.id) ? (
                    <><UserCheck className="w-3 h-3" /> Following</>
                  ) : (
                    <><UserPlus className="w-3 h-3" /> Follow</>
                  )}
                </button>
              </div>
              {artist.bio && (
                <p className="text-xs text-[#64748b] mt-3 line-clamp-2">{artist.bio}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
