import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LogOut, Edit3 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { MOCK_USERS } from '@/lib/mockData'
import { getInitials, formatCount } from '@/lib/utils'

export default function ProfilePage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const storeUser = useAuthStore((s) => s.user)
  // Fall back to mock user for display
  const user = storeUser ?? MOCK_USERS[0]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-6 pb-32 max-w-2xl"
    >
      <h1 className="text-2xl font-bold text-[#f8fafc] mb-6">Profile</h1>

      {/* Avatar section */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-5">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-20 h-20 rounded-full object-cover border-2 border-violet-500/30"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-violet-600/30 border-2 border-violet-500/30 flex items-center justify-center text-2xl font-bold text-violet-300">
              {getInitials(user.username)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-[#f8fafc]">{user.username}</h2>
            <p className="text-sm text-[#94a3b8]">{user.email}</p>
            {user.role === 'admin' && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-violet-600/20 text-violet-300 border border-violet-500/30">
                Admin
              </span>
            )}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 border border-white/8 text-[#94a3b8] hover:text-[#f8fafc] transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Playlists', value: 5 },
          { label: 'Liked Songs', value: 6 },
          { label: 'Following', value: formatCount(2) },
        ].map(({ label, value }) => (
          <div key={label} className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#f8fafc]">{value}</p>
            <p className="text-xs text-[#94a3b8] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Account info */}
      <div className="glass rounded-2xl p-5 mb-6 space-y-3">
        <h3 className="text-sm font-semibold text-[#f8fafc]">Account</h3>
        {[
          { label: 'Username', value: user.username },
          { label: 'Email', value: user.email },
          { label: 'Member since', value: new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-sm text-[#94a3b8]">{label}</span>
            <span className="text-sm text-[#f8fafc]">{value}</span>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-pink-400 border border-pink-400/20 hover:bg-pink-400/10 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </motion.div>
  )
}
