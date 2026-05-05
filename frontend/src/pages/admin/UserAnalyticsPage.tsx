import { motion } from 'framer-motion'
import { MOCK_USERS, MOCK_STATS } from '@/lib/mockData'
import { formatCount, getInitials } from '@/lib/utils'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const stats = MOCK_STATS.adminDashboard
const COLORS = ['#7c3aed', '#06b6d4', '#f472b6', '#a78bfa', '#22d3ee', '#818cf8']

export default function UserAnalyticsPage() {
  const genreData = stats.topGenres.map(({ genre, plays, percentage }) => ({
    name: genre,
    value: plays,
    percentage,
  }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-[#f8fafc]">User Analytics</h1>
        <p className="text-sm text-[#94a3b8] mt-0.5">Breakdown of user behaviour and demographics.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',       value: formatCount(stats.totalUsers) },
          { label: 'MAU',               value: formatCount(stats.monthlyActiveUsers) },
          { label: 'New (this month)',   value: formatCount(stats.newUsersThisMonth) },
          { label: 'Avg Session',        value: `${stats.avgSessionMinutes} min` },
        ].map(({ label, value }) => (
          <div key={label} className="glass rounded-2xl p-4">
            <p className="text-xl font-bold text-[#f8fafc]">{value}</p>
            <p className="text-xs text-[#94a3b8] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Genre breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-base font-semibold text-[#f8fafc] mb-4">Plays by Genre</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={genreData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {genreData.map((_entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                formatter={(v) => [formatCount(v as number), 'Plays']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {genreData.map(({ name, percentage }, i) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-[#94a3b8]">{name}</span>
                </div>
                <span className="text-[#64748b]">{percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* User list */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-base font-semibold text-[#f8fafc] mb-4">Recent Users</h2>
          <div className="space-y-3">
            {MOCK_USERS.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-violet-600/30 flex items-center justify-center text-sm font-bold text-violet-300">
                    {getInitials(user.username)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#f8fafc] truncate">{user.username}</p>
                  <p className="text-xs text-[#94a3b8]">{user.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === 'admin' ? 'bg-violet-600/20 text-violet-300' : 'bg-white/5 text-[#94a3b8]'}`}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
