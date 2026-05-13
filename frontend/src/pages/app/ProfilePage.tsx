import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LogOut, Heart, ListMusic, Users, Zap, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { PlaylistService } from '@/services/playlist.service'
import { getInitials } from '@/lib/utils'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export default function ProfilePage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const likedCount = useFavoritesStore((s) => s.tracks.length)
  const { subscription, hasSubscription, fetch: fetchSub } = useSubscriptionStore()
  const [playlistCount, setPlaylistCount] = useState<number | null>(null)

  useEffect(() => {
    PlaylistService.getUserPlaylists()
      .then((pls) => setPlaylistCount(pls.length))
      .catch(() => setPlaylistCount(0))
    fetchSub()
  }, [fetchSub])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const displayName = (user as { username?: string; name?: string } | null)?.username
    ?? (user as { name?: string } | null)?.name
    ?? 'User'
  const email = (user as { email?: string } | null)?.email ?? ''
  const createdAt = (user as { createdAt?: string | number } | null)?.createdAt

  const stats = [
    { label: 'Playlists', value: playlistCount ?? '—', icon: ListMusic, color: 'from-violet-500/20 to-violet-600/10', iconColor: 'text-violet-400' },
    { label: 'Liked Songs', value: likedCount, icon: Heart, color: 'from-pink-500/20 to-rose-600/10', iconColor: 'text-pink-400' },
    { label: 'Following', value: 0, icon: Users, color: 'from-cyan-500/20 to-cyan-600/10', iconColor: 'text-cyan-400' },
  ]

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-6 pb-32 max-w-2xl"
    >
      {/* Avatar card */}
      <motion.div variants={item} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.08] p-6 mb-5">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-violet-900/30 flex-shrink-0">
            {getInitials(displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white tracking-tight truncate">{displayName}</h2>
            <p className="text-sm text-white/40 mt-0.5 truncate">{email}</p>
            {createdAt && (
              <p className="text-xs text-white/25 mt-1">
                Member since {new Date(typeof createdAt === 'number' ? createdAt * 1000 : createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3 mb-5">
        {stats.map(({ label, value, icon: Icon, color, iconColor }) => (
          <div key={label} className={`rounded-2xl bg-gradient-to-br ${color} border border-white/[0.06] p-4 text-center`}>
            <div className="flex justify-center mb-2">
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-white/35 mt-0.5">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Subscription */}
      <motion.div variants={item} className="rounded-2xl bg-white/[0.03] border border-white/[0.07] mb-5 overflow-hidden">
        <div className="px-5 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-3">Subscription</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {hasSubscription && subscription?.plan_slug !== 'free' ? (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-white/40" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white">
                  {hasSubscription ? subscription?.plan_name : 'Free'}
                </p>
                {subscription?.expires_at && (
                  <p className="text-xs text-white/30">
                    Until {new Date(subscription.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
            {(!hasSubscription || subscription?.plan_slug === 'free') && (
              <button
                onClick={() => navigate('/premium')}
                className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Account details */}
      <motion.div variants={item} className="rounded-2xl bg-white/[0.03] border border-white/[0.07] divide-y divide-white/[0.05] mb-5 overflow-hidden">
        <div className="px-5 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-3">Account</p>
          {[
            { label: 'Username', value: displayName },
            { label: 'Email', value: email },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
              <span className="text-sm text-white/40">{label}</span>
              <span className="text-sm text-white/80 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sign out */}
      <motion.div variants={item}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30 transition-all w-full justify-center"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </motion.div>
    </motion.div>
  )
}
