import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlaylistService } from '@/services/playlist.service';
import type { Playlist } from '@/types';
import {
  Home,
  Sparkles,
  Music,
  Mic2,
  Disc3,
  Library,
  Heart,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  ListMusic,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
import { useSidebarStore } from '@/store/sidebarStore';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: Home, path: '/home' },
  { label: 'Discover', icon: Sparkles, path: '/discover/moods' },
  { label: 'Tracks', icon: Music, path: '/tracks' },
  { label: 'Artists', icon: Mic2, path: '/artists' },
  { label: 'Albums', icon: Disc3, path: '/albums' },
  { label: 'Library', icon: Library, path: '/library' },
  { label: 'Favorites', icon: Heart, path: '/favorites' },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore() as { user: { username?: string; email?: string; avatarUrl?: string; name?: string; avatar?: string } | null };
  const { currentTrack } = usePlayerStore();
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  const [playlistHover, setPlaylistHover] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    PlaylistService.getUserPlaylists().then(setPlaylists).catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    setCreating(true);
    try {
      const pl = await PlaylistService.createPlaylist({ name: newPlaylistName.trim() });
      setPlaylists((prev) => [pl, ...prev]);
      setNewPlaylistName('');
      setShowCreateModal(false);
      navigate(`/playlists/${pl.id}`);
    } finally {
      setCreating(false);
    }
  }

  const sidebarWidth = isCollapsed ? 72 : 240;

  return (
    <motion.aside
      animate={{ width: sidebarWidth }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-[#0d0d1a] border-r border-white/[0.06] overflow-hidden"
      style={{ width: sidebarWidth }}
    >
      {/* AURA Logo */}
      <div className="flex items-center h-16 px-4 flex-shrink-0 border-b border-white/[0.04] relative">
        <motion.div
          animate={{ opacity: 1 }}
          className="flex items-center gap-2.5 min-w-0"
        >
          {/* Animated logo icon */}
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-lg shadow-violet-900/50">
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="block w-3.5 h-3.5 rounded-full border-2 border-white/90 border-t-transparent"
              />
            </div>
            <motion.div
              className="absolute inset-0 rounded-xl bg-violet-500/40 blur-sm -z-10"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-black tracking-widest bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap"
              >
                AURA
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Collapse toggle */}
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleCollapse}
          className={clsx(
            'absolute right-3 w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-white/80 transition-colors duration-200',
            isCollapsed && 'right-1/2 translate-x-1/2'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 px-2 pt-4 flex-shrink-0">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path ||
            (path.length > 1 && location.pathname.startsWith(path + '/'));

          return (
            <NavLink key={path} to={path}>
              <motion.div
                whileHover={{ x: isCollapsed ? 0 : 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={clsx(
                  'flex items-center gap-3 px-2.5 py-2 rounded-xl relative overflow-hidden transition-colors duration-200 cursor-pointer',
                  isCollapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-violet-500/15 text-violet-300'
                    : 'text-white/50 hover:text-white/90 hover:bg-white/[0.04]'
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.8)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <Icon
                    className={clsx(
                      'w-[18px] h-[18px] transition-all duration-200',
                      isActive && 'drop-shadow-[0_0_6px_rgba(167,139,250,0.8)]'
                    )}
                  />
                </div>

                {/* Label */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Active background glow */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 -z-10 bg-gradient-to-r from-violet-600/10 to-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Playlists section */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col mt-4 px-4 min-h-0 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/25">
                Playlists
              </span>
              <motion.button
                whileHover={{ scale: 1.15, color: 'rgba(167, 139, 250, 1)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowCreateModal(true)}
                className="text-white/30 hover:text-violet-400 transition-colors duration-200"
                title="New Playlist"
              >
                <Plus className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            <div className="flex flex-col gap-0.5 overflow-y-auto max-h-40 scrollbar-none">
              {playlists.length === 0 && (
                <p className="text-[11px] text-white/20 px-2 py-1">No playlists yet</p>
              )}
              {playlists.map((pl) => (
                <motion.button
                  key={pl.id}
                  onHoverStart={() => setPlaylistHover(pl.id)}
                  onHoverEnd={() => setPlaylistHover(null)}
                  whileHover={{ x: 2 }}
                  onClick={() => navigate(`/playlists/${pl.id}`)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-white/[0.04] transition-colors duration-150 group"
                >
                  <ListMusic
                    className={clsx(
                      'w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200',
                      playlistHover === pl.id ? 'text-violet-400' : 'text-white/25'
                    )}
                  />
                  <span className="text-xs text-white/50 group-hover:text-white/80 truncate transition-colors duration-200">
                    {pl.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create playlist modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-80 bg-[#13131f] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-base font-semibold text-white mb-4">New Playlist</h3>
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <input
                  autoFocus
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60"
                />
                <div className="flex gap-2 justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newPlaylistName.trim() || creating}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Now playing mini-hint (when collapsed) */}
      <AnimatePresence>
        {isCollapsed && currentTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-2 pb-3 flex justify-center"
          >
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-violet-500/40 shadow-lg shadow-violet-900/30">
              <img
                src={currentTrack.coverUrl || '/placeholder-cover.png'}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User section */}
      <div className="border-t border-white/[0.04] px-3 py-3 flex items-center gap-2.5 flex-shrink-0">
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-violet-600 to-cyan-500 cursor-pointer"
          onClick={() => navigate('/profile')}
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username ?? ''} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
              {(user?.username ?? user?.name ?? 'U')[0].toUpperCase()}
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex-1 min-w-0 flex items-center justify-between gap-1"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white/80 truncate">
                  {user?.username ?? user?.name ?? 'User'}
                </p>
                <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
              </div>
              <motion.button
                whileHover={{ rotate: 30, color: 'rgba(167, 139, 250, 1)' }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate('/settings')}
                className="text-white/25 hover:text-violet-400 flex-shrink-0"
              >
                <Settings className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};
