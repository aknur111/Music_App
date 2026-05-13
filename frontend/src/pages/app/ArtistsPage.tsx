import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserCheck, UserPlus, Mic2 } from 'lucide-react'
import { MusicService } from '@/services'
import { formatCount, cn } from '@/lib/utils'
import type { Artist } from '@/types'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const card = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } }

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    MusicService.getArtists().then(setArtists).finally(() => setLoading(false))
  }, [])

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
      transition={{ duration: 0.35 }}
      className="p-6 pb-32"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Artists</h1>
        <p className="text-white/40 text-sm mt-0.5">{loading ? '…' : `${artists.length} artists`}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {artists.map((artist) => {
            const followed = followedIds.has(artist.id)
            return (
              <motion.div
                key={artist.id}
                variants={card}
                whileHover={{ y: -2 }}
                onClick={() => {}}
                className="group cursor-pointer bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-violet-500/20 rounded-2xl overflow-hidden transition-all duration-200"
              >
                {/* Banner */}
                <div className="h-20 relative overflow-hidden">
                  {artist.coverUrl ?? artist.avatarUrl ? (
                    <img
                      src={artist.coverUrl ?? artist.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-900/60 via-purple-900/40 to-cyan-900/30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a]/80 to-transparent" />
                </div>

                <div className="px-4 pb-4">
                  {/* Avatar */}
                  <div className="-mt-8 mb-3 flex items-end justify-between">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#0d0d1a] bg-violet-900/30 flex-shrink-0">
                      {artist.avatarUrl ? (
                        <img src={artist.avatarUrl} alt={artist.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Mic2 className="w-6 h-6 text-violet-400/50" />
                        </div>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); toggle(artist.id) }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                        followed
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : 'bg-white/[0.06] text-white/50 border border-white/[0.08] hover:border-violet-500/30 hover:text-white',
                      )}
                    >
                      {followed ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                      {followed ? 'Following' : 'Follow'}
                    </motion.button>
                  </div>

                  <h3 className="font-bold text-white truncate group-hover:text-violet-300 transition-colors">{artist.name}</h3>
                  <p className="text-xs text-white/40 mt-0.5">{artist.genre}</p>
                  <p className="text-xs text-white/25 mt-1">
                    {formatCount(artist.followerCount)} followers · {artist.albumCount} albums
                  </p>
                  {artist.bio && (
                    <p className="text-xs text-white/30 mt-2 line-clamp-2 leading-relaxed">{artist.bio}</p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
