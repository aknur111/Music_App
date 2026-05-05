import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { DEMO_TRACKS } from '@/lib/constants'
import { formatCount, formatDuration } from '@/lib/utils'

// Build genre play-count aggregation
const genreTotals = DEMO_TRACKS.reduce<Record<string, number>>((acc, t) => {
  acc[t.genre] = (acc[t.genre] ?? 0) + t.playCount
  return acc
}, {})
const genreChartData = Object.entries(genreTotals)
  .map(([genre, plays]) => ({ genre, plays }))
  .sort((a, b) => b.plays - a.plays)

const topTracks = [...DEMO_TRACKS].sort((a, b) => b.playCount - a.playCount)

export default function TrackAnalyticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-[#f8fafc]">Track Analytics</h1>
        <p className="text-sm text-[#94a3b8] mt-0.5">Play counts, genres, and top-performing tracks.</p>
      </div>

      {/* Genre bar chart */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-base font-semibold text-[#f8fafc] mb-4">Plays by Genre</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={genreChartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="genre" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCount(v as number)} />
            <Tooltip
              cursor={{ fill: 'rgba(124,58,237,0.08)' }}
              contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
              formatter={(v) => [formatCount(v as number), 'Plays']}
            />
            <Bar dataKey="plays" fill="#7c3aed" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top tracks table */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-base font-semibold text-[#f8fafc] mb-4">Top Tracks by Plays</h2>
        <div className="space-y-1">
          <div className="grid grid-cols-[2rem_1fr_5rem_5rem_5rem] gap-4 px-3 text-xs text-[#64748b] uppercase tracking-wide pb-2 border-b border-white/8">
            <span>#</span><span>Track</span><span className="text-right">Plays</span>
            <span className="text-right">Likes</span><span className="text-right">Duration</span>
          </div>
          {topTracks.map((track, i) => (
            <div
              key={track.id}
              className="grid grid-cols-[2rem_1fr_5rem_5rem_5rem] gap-4 px-3 py-2.5 rounded-xl hover:bg-white/4 transition-colors items-center"
            >
              <span className="text-sm text-[#64748b] font-mono">{i + 1}</span>
              <div className="flex items-center gap-3 min-w-0">
                <img src={track.coverUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#f8fafc] truncate">{track.title}</p>
                  <p className="text-xs text-[#94a3b8]">{track.artist}</p>
                </div>
              </div>
              <p className="text-sm text-[#94a3b8] text-right">{formatCount(track.playCount)}</p>
              <p className="text-sm text-[#94a3b8] text-right">{formatCount(track.likeCount)}</p>
              <p className="text-sm text-[#94a3b8] text-right tabular-nums">{formatDuration(track.duration)}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
