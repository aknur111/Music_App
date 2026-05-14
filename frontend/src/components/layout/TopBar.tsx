import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  User,
  LayoutDashboard,
  LogOut,
  X,
  Music,
  Disc3,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/authStore';
import { useSidebarStore } from '@/store/sidebarStore';
import useDebounce from '@/hooks/useDebounce';
import MusicService from '@/services/music.service';
import type { Track, Artist } from '@/types';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();

  const { user, isAdmin, logout } = useAuthStore() as {
    user: {
      username?: string;
      name?: string;
      email?: string;
      avatarUrl?: string;
      avatar?: string;
    } | null;
    isAdmin: boolean;
    logout: () => void;
  };

  const { isCollapsed } = useSidebarStore();

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const [trackResults, setTrackResults] = useState<Track[]>([]);
  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const debouncedQuery = useDebounce(searchValue, 400);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifsRead, setNotifsRead] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const NOTIFICATIONS = [
    {
      id: '1',
      icon: Music,
      text: 'Luna Lux released "Electric Soul"',
      time: '2h ago',
      unread: true,
    },
    {
      id: '2',
      icon: Sparkles,
      text: 'Your weekly picks are ready',
      time: '5h ago',
      unread: true,
    },
    {
      id: '3',
      icon: Disc3,
      text: 'New tracks added to Chill Ambient',
      time: '1d ago',
      unread: false,
    },
  ];

  const handleNotifClick = () => {
    setNotifOpen((v) => {
      if (!v) setNotifsRead(true);
      return !v;
    });
  };

  // Close panels on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }

      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);

    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, []);

  // Search tracks + artists
  useEffect(() => {
    async function search() {
      const query = debouncedQuery.trim();

      if (!query) {
        setTrackResults([]);
        setArtistResults([]);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);

      try {
        const [tracks, artists] = await Promise.all([
          MusicService.searchTracks(query),
          MusicService.searchArtists(query),
        ]);

        setTrackResults(tracks.slice(0, 5));
        setArtistResults(artists.slice(0, 5));
      } finally {
        setSearchLoading(false);
      }
    }

    search();
  }, [debouncedQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchValue.trim()) {
      navigate(`/tracks?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
      setTrackResults([]);
      setArtistResults([]);
    }
  };

  const sidebarWidth = isCollapsed ? 72 : 240;

  const hasSearchResults =
    trackResults.length > 0 || artistResults.length > 0;

  return (
    <motion.header
      animate={{ left: sidebarWidth }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="fixed top-0 right-0 z-30 h-16 flex items-center px-6 gap-4"
      style={{ left: sidebarWidth }}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-[#06060e]/80 backdrop-blur-xl border-b border-white/[0.05]" />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-4 w-full">
        {/* Back/Forward */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {[
            {
              icon: ChevronLeft,
              action: () => navigate(-1),
              label: 'Back',
            },
            {
              icon: ChevronRight,
              action: () => navigate(1),
              label: 'Forward',
            },
          ].map(({ icon: Icon, action, label }) => (
            <motion.button
              key={label}
              whileHover={{
                scale: 1.1,
                backgroundColor: 'rgba(255,255,255,0.08)',
              }}
              whileTap={{ scale: 0.9 }}
              onClick={action}
              title={label}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/90 transition-colors duration-200"
            >
              <Icon className="w-4 h-4" />
            </motion.button>
          ))}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <motion.div
            animate={{
              width: searchFocused ? '100%' : '220px',
              boxShadow: searchFocused
                ? '0 0 0 2px rgba(124,58,237,0.5), 0 0 20px rgba(124,58,237,0.15)'
                : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative flex items-center rounded-xl bg-white/5 overflow-hidden"
          >
            <Search
              className={clsx(
                'absolute left-3 w-4 h-4 transition-colors duration-200 pointer-events-none',
                searchFocused ? 'text-violet-400' : 'text-white/30',
              )}
            />

            <input
              ref={searchRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search tracks, artists, albums…"
              className="w-full bg-transparent pl-9 pr-8 py-2 text-sm text-white placeholder:text-white/25 outline-none"
            />

            <AnimatePresence>
              {searchValue && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  type="button"
                  onClick={() => {
                    setSearchValue('');
                    setTrackResults([]);
                    setArtistResults([]);
                    searchRef.current?.focus();
                  }}
                  className="absolute right-2.5 text-white/30 hover:text-white/70 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {searchValue && (
            <div className="absolute top-14 left-0 w-full max-w-md bg-[#13131f] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
              {searchLoading && (
                <div className="p-4 text-sm text-white/40">
                  Searching...
                </div>
              )}

              {!searchLoading && trackResults.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                    Tracks
                  </div>

                  {trackResults.map((track) => (
                    <button
                      key={track.id}
                      onMouseDown={() => {
                        navigate(
                          `/tracks?q=${encodeURIComponent(track.title)}`,
                        );
                        setSearchValue('');
                        setTrackResults([]);
                        setArtistResults([]);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-white/[0.05] transition-colors"
                    >
                      <p className="text-sm text-white">
                        {track.title}
                      </p>

                      <p className="text-xs text-white/40">
                        {track.artist}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {!searchLoading && artistResults.length > 0 && (
                <div className="border-t border-white/[0.06]">
                  <div className="px-4 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                    Artists
                  </div>

                  {artistResults.map((artist) => (
                    <button
                      key={artist.id}
                      onMouseDown={() => {
                        navigate(
                          `/artists?q=${encodeURIComponent(artist.name)}`,
                        );
                        setSearchValue('');
                        setTrackResults([]);
                        setArtistResults([]);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-white/[0.05] transition-colors"
                    >
                      <p className="text-sm text-white">
                        {artist.name}
                      </p>

                      <p className="text-xs text-white/40">
                        Artist
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {!searchLoading && searchValue && !hasSearchResults && (
                <div className="p-4 text-sm text-white/40">
                  No results
                </div>
              )}
            </div>
          )}
        </form>

        {/* Right side */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNotifClick}
              className="relative w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/90 hover:bg-white/5 transition-colors duration-200"
            >
              <Bell className="w-4 h-4" />

              {!notifsRead && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-violet-500 ring-2 ring-[#06060e]" />
              )}
            </motion.button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.93, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.93, y: -6 }}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 30,
                  }}
                  className="absolute right-0 top-11 w-72 bg-[#13131f] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">
                      Notifications
                    </p>

                    <span className="text-[10px] text-white/30 font-medium uppercase tracking-wide">
                      3 new
                    </span>
                  </div>

                  <div className="divide-y divide-white/[0.04]">
                    {NOTIFICATIONS.map(
                      ({ id, icon: Icon, text, time, unread }) => (
                        <div
                          key={id}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                        >
                          <div
                            className={clsx(
                              'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                              unread
                                ? 'bg-violet-500/20'
                                : 'bg-white/[0.05]',
                            )}
                          >
                            <Icon
                              className={clsx(
                                'w-4 h-4',
                                unread
                                  ? 'text-violet-400'
                                  : 'text-white/30',
                              )}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/80 leading-relaxed">
                              {text}
                            </p>

                            <p className="text-[10px] text-white/30 mt-0.5">
                              {time}
                            </p>
                          </div>

                          {unread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0 mt-2" />
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar + dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/10 transition-all duration-200"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-br from-violet-600 to-cyan-500 flex-shrink-0">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username ?? ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                    {(user?.username ?? user?.name ?? 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>

              <span className="text-sm font-medium text-white/80 max-w-[100px] truncate hidden sm:block">
                {user?.username ?? user?.name ?? 'User'}
              </span>
            </motion.button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.93, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.93, y: -6 }}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 30,
                  }}
                  className="absolute right-0 top-11 w-52 bg-[#13131f] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.username ?? user?.name}
                    </p>

                    <p className="text-xs text-white/40 truncate">
                      {user?.email}
                    </p>
                  </div>

                  <div className="p-1.5 flex flex-col gap-0.5">
                    {[
                      {
                        label: 'View Profile',
                        icon: User,
                        action: () => {
                          navigate('/profile');
                          setDropdownOpen(false);
                        },
                      },
                      ...(isAdmin
                        ? [
                            {
                              label: 'Admin Dashboard',
                              icon: LayoutDashboard,
                              action: () => {
                                navigate('/admin');
                                setDropdownOpen(false);
                              },
                            },
                          ]
                        : []),
                    ].map(({ label, icon: Icon, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors duration-150"
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {label}
                      </button>
                    ))}

                    <div className="my-0.5 border-t border-white/[0.04]" />

                    <button
                      onClick={() => {
                        logout();
                        navigate('/login');
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.07] rounded-xl transition-colors duration-150"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
};