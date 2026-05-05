import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight, Shuffle, Pause, TrendingUp, Disc3, Users } from 'lucide-react';
import { MusicService } from '@/services/music.service';
import { TrackCard } from '@/components/shared/TrackCard';
import { AlbumCard } from '@/components/shared/AlbumCard';
import { ArtistCard } from '@/components/shared/ArtistCard';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import type { Track, Album, Artist } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): { greeting: string; message: string } {
  const hour = new Date().getHours();
  if (hour < 5) return { greeting: 'Good night', message: 'Still up? Let the music carry you.' };
  if (hour < 12) return { greeting: 'Good morning', message: 'Start your day with something great.' };
  if (hour < 17) return { greeting: 'Good afternoon', message: "Here's what's trending right now." };
  if (hour < 21) return { greeting: 'Good evening', message: 'Wind down with hand-picked sounds.' };
  return { greeting: 'Good night', message: 'The night is young. So is the music.' };
}

// ─── Horizontal Scroll Section ────────────────────────────────────────────────

interface HScrollProps {
  children: React.ReactNode;
  className?: string;
}

const HScroll: React.FC<HScrollProps> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    updateArrows();
    return () => el.removeEventListener('scroll', updateArrows);
  }, [updateArrows]);

  const scroll = (dir: 'left' | 'right') => {
    ref.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  return (
    <div className="relative group/hscroll">
      <AnimatePresence>
        {canLeft && (
          <motion.button
            key="left"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-[#1a1a2e] border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-violet-600/40 hover:border-violet-500/40 transition-all shadow-lg shadow-black/40"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
      <div
        ref={ref}
        className={`flex gap-4 overflow-x-auto scrollbar-none pb-1 ${className ?? ''}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
      <AnimatePresence>
        {canRight && (
          <motion.button
            key="right"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-[#1a1a2e] border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-violet-600/40 hover:border-violet-500/40 transition-all shadow-lg shadow-black/40"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Featured Mix Card ────────────────────────────────────────────────────────

const GRADIENT_PRESETS = [
  'from-violet-900 via-purple-800 to-indigo-900',
  'from-cyan-900 via-teal-800 to-emerald-900',
  'from-rose-900 via-pink-800 to-fuchsia-900',
  'from-amber-900 via-orange-800 to-red-900',
];

interface FeaturedMixCardProps {
  track: Track;
  index: number;
  onPlay: (track: Track) => void;
}

const FeaturedMixCard: React.FC<FeaturedMixCardProps> = ({ track, index, onPlay }) => {
  const { currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const isActive = currentTrack?.id === track.id;
  const gradient = GRADIENT_PRESETS[index % GRADIENT_PRESETS.length];

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="relative flex-shrink-0 w-52 h-64 rounded-2xl overflow-hidden cursor-pointer group"
      onClick={() => onPlay(track)}
    >
      {/* Art */}
      {track.coverUrl ? (
        <img src={track.coverUrl} alt={track.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      {/* Border glow */}
      {isActive && <div className="absolute inset-0 ring-2 ring-inset ring-violet-500/50 rounded-2xl" />}

      {/* Play button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.7 }}
        whileInView={{ opacity: 1 }}
        animate={isActive ? { opacity: 1, scale: 1 } : {}}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-violet-600/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); isActive ? togglePlay() : onPlay(track); }}
      >
        {isActive && isPlaying ? (
          <Pause className="w-4 h-4 text-white fill-white" />
        ) : (
          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
        )}
      </motion.button>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-1">Featured Mix</p>
        <p className="text-sm font-bold text-white leading-tight">{track.title}</p>
        <p className="text-xs text-white/50 mt-0.5">{track.artist}</p>
      </div>
    </motion.div>
  );
};

// ─── Hero Featured Track ──────────────────────────────────────────────────────

interface HeroTrackProps {
  track: Track;
}

const HeroTrack: React.FC<HeroTrackProps> = ({ track }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const isActive = currentTrack?.id === track.id;

  const handlePlay = () => {
    if (isActive) togglePlay();
    else playTrack(track, [track]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative rounded-3xl overflow-hidden h-72 flex items-end"
    >
      {/* Background art with blur */}
      {track.coverUrl && (
        <>
          <div className="absolute inset-0">
            <img src={track.coverUrl} alt="" className="w-full h-full object-cover scale-110 blur-sm opacity-60" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </>
      )}

      {/* Ambient animated gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{ background: ['radial-gradient(ellipse at 20% 50%, #7c3aed44 0%, transparent 60%)', 'radial-gradient(ellipse at 40% 30%, #06b6d444 0%, transparent 60%)', 'radial-gradient(ellipse at 20% 50%, #7c3aed44 0%, transparent 60%)'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-end gap-6 p-8 w-full">
        {/* Album art thumb */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10"
        >
          {track.coverUrl ? (
            <img src={track.coverUrl} alt={track.album} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-700 to-cyan-700 flex items-center justify-center">
              <Disc3 className="w-10 h-10 text-white/40" />
            </div>
          )}
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-1"
          >
            Featured Track
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-black text-white tracking-tight mb-1 truncate"
          >
            {track.title}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-sm mb-4"
          >
            {track.artist} &bull; {track.album}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlay}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-900/50 transition-colors"
            >
              {isActive && isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              {isActive && isPlaying ? 'Pause' : 'Play Now'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-sm transition-colors backdrop-blur-sm"
            >
              <Shuffle className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Stagger container ────────────────────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { playTrack } = usePlayerStore();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  const { greeting, message } = getGreeting();
  const displayName = user?.username ?? user?.email?.split('@')[0] ?? 'there';

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      MusicService.getTracks(1, 20),
      MusicService.getAlbums(),
      MusicService.getArtists(),
    ]).then(([t, a, ar]) => {
      if (!alive) return;
      setTracks(t);
      setAlbums(a);
      setArtists(ar);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const featuredTrack = tracks[0] ?? null;
  const featuredMix = tracks.slice(1, 5);
  const trendingTracks = tracks.slice(0, 10);

  return (
    <div className="min-h-screen px-6 py-8 space-y-10 max-w-7xl mx-auto">
      {/* ── Greeting Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900/30 via-purple-900/20 to-cyan-900/20 border border-white/[0.06] p-8"
      >
        {/* Ambient blobs */}
        <motion.div
          className="absolute top-0 left-0 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-60 h-60 bg-cyan-600/15 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        <div className="relative z-10">
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-violet-400 font-semibold uppercase tracking-widest mb-2"
          >
            {greeting}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
            className="text-4xl font-black text-white tracking-tight mb-2"
          >
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">{displayName}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-white/50 text-base"
          >
            {message}
          </motion.p>
        </div>
      </motion.div>

      {/* ── Featured Hero Track ── */}
      {loading ? (
        <Skeleton variant="rect" className="h-72 w-full rounded-3xl" />
      ) : featuredTrack ? (
        <HeroTrack track={featuredTrack} />
      ) : null}

      {/* ── Featured Mix ── */}
      <section>
        <SectionHeader title="Featured Mix" subtitle="Curated picks just for you" className="mb-4" />
        {loading ? (
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rect" className="flex-shrink-0 w-52 h-64 rounded-2xl" />)}
          </div>
        ) : (
          <HScroll>
            {featuredMix.map((track, idx) => (
              <motion.div key={track.id} variants={item} initial="hidden" animate="show" transition={{ delay: idx * 0.05 }}>
                <FeaturedMixCard track={track} index={idx} onPlay={(t) => playTrack(t, featuredMix)} />
              </motion.div>
            ))}
          </HScroll>
        )}
      </section>

      {/* ── Trending Tracks ── */}
      <section>
        <SectionHeader
          title="Trending Tracks"
          subtitle="What everyone is listening to"
          viewAllHref="/tracks"
          action={<TrendingUp className="w-4 h-4 text-cyan-400" />}
          className="mb-4"
        />
        {loading ? (
          <div className="space-y-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5">
                <Skeleton variant="rect" width={32} height={32} className="flex-shrink-0 rounded-lg" />
                <Skeleton variant="rect" width={40} height={40} className="flex-shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="rect" height={12} className="w-2/3 rounded-full" />
                  <Skeleton variant="rect" height={10} className="w-1/3 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-0.5">
            {trendingTracks.map((track, idx) => (
              <motion.div key={track.id} variants={item}>
                <TrackCard
                  track={track}
                  index={idx}
                  showIndex
                  onAddToQueue={(t) => usePlayerStore.getState().addToQueue(t)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ── New Albums ── */}
      <section>
        <SectionHeader
          title="New Albums"
          subtitle="Fresh releases this week"
          viewAllHref="/albums"
          action={<Disc3 className="w-4 h-4 text-violet-400" />}
          className="mb-4"
        />
        {loading ? (
          <div className="flex gap-4">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} variant="card" className="flex-shrink-0 w-44" />)}
          </div>
        ) : (
          <HScroll>
            {albums.map((album, idx) => (
              <motion.div key={album.id} variants={item} initial="hidden" animate="show" transition={{ delay: idx * 0.04 }}>
                <AlbumCard
                  album={album}
                  className="flex-shrink-0 w-44"
                  onClick={(a) => navigate(`/albums/${a.id}`)}
                />
              </motion.div>
            ))}
          </HScroll>
        )}
      </section>

      {/* ── Popular Artists ── */}
      <section>
        <SectionHeader
          title="Popular Artists"
          subtitle="Follow your favorites"
          viewAllHref="/artists"
          action={<Users className="w-4 h-4 text-cyan-400" />}
          className="mb-4"
        />
        {loading ? (
          <div className="flex gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-3 flex-shrink-0">
                <Skeleton variant="circle" width={80} height={80} />
                <Skeleton variant="rect" width={64} height={12} className="rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <HScroll>
            {artists.map((artist, idx) => (
              <motion.div key={artist.id} variants={item} initial="hidden" animate="show" transition={{ delay: idx * 0.04 }}>
                <ArtistCard artist={artist} className="flex-shrink-0 w-32" />
              </motion.div>
            ))}
          </HScroll>
        )}
      </section>
    </div>
  );
};

export default HomePage;
