import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Heart, Search } from 'lucide-react'
import { DEMO_TRACKS } from '@/lib/constants'
import { formatDuration, formatCount, cn } from '@/lib/utils'
import type { Track } from '@/types'

export default function TracksPage() {
  const [search, setSearch] = useState('')
  const [likedIds, setLikedIds] = useState<Set<string>>(
    () => new Set(DEMO_TRACKS.filter((t) => t.isLiked).map((t) => t.id)),
  )

  const filtered = DEMO_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase()),
  )

  const toggleLike = (id: string) =>
    setLikedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-6 pb-32 space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#f8fafc]">Tracks</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracks…"
            className={cn(
              'pl-9 pr-4 py-2 rounded-xl text-sm text-[#f8fafc] w-56',
              'bg-white/5 border border-white/8 placeholder-[#64748b]',
              'focus:outline-none focus:border-violet-500',
            )}
          />
        </div>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[2rem_1fr_1fr_5rem_5rem_3rem] gap-4 px-4 text-xs text-[#64748b] font-medium uppercase tracking-wide border-b border-white/8 pb-2">
        <span>#</span>
        <span>Title</span>
        <span>Album</span>
        <span className="text-right">Plays</span>
        <span className="text-right">Duration</span>
        <span />
      </div>

      <div className="space-y-1">
        {filtered.map((track: Track, i) => (
          <div
            key={track.id}
            className="grid grid-cols-[2rem_1fr_1fr_5rem_5rem_3rem] gap-4 px-4 py-2.5 rounded-xl hover:bg-white/4 transition-colors group cursor-pointer items-center"
          >
            <span className="text-sm text-[#64748b] font-mono text-right group-hover:hidden">
              {i + 1}
            </span>
            <button className="hidden group-hover:flex items-center justify-end">
              <Play className="w-4 h-4 fill-violet-400 text-violet-400" />
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <img src={track.coverUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#f8fafc] truncate">{track.title}</p>
                <p className="text-xs text-[#94a3b8] truncate">{track.artist}</p>
              </div>
            </div>
            <p className="text-sm text-[#64748b] truncate">{track.album}</p>
            <p className="text-sm text-[#64748b] text-right">{formatCount(track.playCount)}</p>
            <p className="text-sm text-[#64748b] text-right tabular-nums">
              {formatDuration(track.duration)}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleLike(track.id)
              }}
              className="flex items-center justify-center"
            >
              <Heart
                className={cn(
                  'w-4 h-4 transition-colors',
                  likedIds.has(track.id)
                    ? 'fill-pink-400 text-pink-400'
                    : 'text-[#64748b] group-hover:text-[#94a3b8]',
                )}
              />
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-[#64748b] py-12">No tracks match your search.</p>
      )}
    </motion.div>
  )
}
