import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid3X3, List, SlidersHorizontal, X, Music2, ChevronDown } from 'lucide-react';
import { MusicService } from '@/services/music.service';
import { TrackCard } from '@/components/shared/TrackCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { usePlayerStore } from '@/store/playerStore';
import type { Track } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortOption = 'popular' | 'newest' | 'az';
type FilterChip = 'all' | 'genre' | 'artist';
type ViewMode = 'list' | 'grid';

const SORT_LABELS: Record<SortOption, string> = {
  popular: 'Most Popular',
  newest: 'Newest',
  az: 'A – Z',
};

const GENRES = ['All', 'Electronic', 'Indie Rock', 'Ambient', 'Neo-Soul', 'Darkwave', 'Hip-Hop', 'Pop', 'Jazz'];

const PAGE_SIZE = 20;

// ─── Track Grid Card (compact grid tile) ─────────────────────────────────────

interface TrackGridTileProps {
  track: Track;
  index: number;
}

const TrackGridTile: React.FC<TrackGridTileProps> = ({ track, index }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const isActive = currentTrack?.id === track.id;
  const [hovered, setHovered] = useState(false);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02, type: 'spring', stiffness: 300, damping: 28 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => isActive ? togglePlay() : playTrack(track)}
      className={`group cursor-pointer rounded-2xl p-3 border transition-all duration-200 ${isActive ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10'}`}
    >
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
        {track.coverUrl ? (
          <img src={track.coverUrl} alt={track.title} className={`w-full h-full object-cover transition-transform duration-500 ${hovered ? 'scale-110' : ''}`} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-900/50 to-cyan-900/30 flex items-center justify-center">
            <Music2 className="w-8 h-8 text-white/20" />
          </div>
        )}
        <AnimatePresence>
          {(hovered || isActive) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center shadow-lg">
                {isActive && isPlaying ? (
                  <span className="w-4 h-4 flex gap-0.5 items-end justify-center">
                    <span className="w-0.5 h-3 bg-white rounded-sm" />
                    <span className="w-0.5 h-3 bg-white rounded-sm" />
                  </span>
                ) : (
                  <svg className="w-4 h-4 text-white fill-white ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className={`text-sm font-semibold truncate transition-colors ${isActive ? 'text-violet-400' : 'text-white group-hover:text-violet-300'}`}>{track.title}</p>
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-xs text-white/40 truncate">{track.artist}</p>
        <span className="text-xs text-white/25 flex-shrink-0 ml-2">{formatDuration(track.duration)}</span>
      </div>
    </motion.div>
  );
};

// ─── Sort Dropdown ────────────────────────────────────────────────────────────

interface SortDropdownProps {
  value: SortOption;
  onChange: (v: SortOption) => void;
}

const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        {SORT_LABELS[value]}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 top-12 z-20 w-44 bg-[#12121f] border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([k, label]) => (
              <button
                key={k}
                onClick={() => { onChange(k); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${value === k ? 'text-violet-400 bg-violet-500/10' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const TracksPage: React.FC = () => {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [displayedTracks, setDisplayedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('popular');
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [view, setView] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Initial load
  useEffect(() => {
    MusicService.getTracks(1, 50).then((tracks) => {
      setAllTracks(tracks);
      setDisplayedTracks(tracks.slice(0, PAGE_SIZE));
      setHasMore(tracks.length > PAGE_SIZE);
      setLoading(false);
    });
  }, []);

  // Sorting helper
  const sortTracks = useCallback((tracks: Track[], s: SortOption): Track[] => {
    const copy = [...tracks];
    if (s === 'popular') copy.sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0));
    else if (s === 'newest') copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else copy.sort((a, b) => a.title.localeCompare(b.title));
    return copy;
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      const filtered = selectedGenre === 'All' ? allTracks : allTracks.filter((t) => t.genre === selectedGenre);
      const sorted = sortTracks(filtered, sort);
      setDisplayedTracks(sorted.slice(0, page * PAGE_SIZE));
      setHasMore(sorted.length > page * PAGE_SIZE);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await MusicService.searchTracks(query);
      setDisplayedTracks(sortTracks(results, sort));
      setHasMore(false);
      setSearchLoading(false);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, sort, selectedGenre, allTracks, page, sortTracks]);

  const loadMore = () => setPage((p) => p + 1);

  const clearSearch = () => { setQuery(''); setPage(1); };

  const filterChips: { id: FilterChip; label: string }[] = [
    { id: 'all', label: 'All Tracks' },
    { id: 'genre', label: 'By Genre' },
    { id: 'artist', label: 'By Artist' },
  ];

  const isLoading = loading || searchLoading;

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Tracks</h1>
          <p className="text-white/40 text-sm mt-1">
            {loading ? 'Loading…' : `${allTracks.length.toLocaleString()} tracks`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SortDropdown value={sort} onChange={(v) => { setSort(v); setPage(1); }} />
          {/* View Toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative"
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
          <Search className="w-4 h-4" />
        </div>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search tracks, artists, albums…"
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Filter chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 flex-wrap"
      >
        {filterChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setActiveFilter(chip.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeFilter === chip.id
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </motion.div>

      {/* Genre pills (shown when By Genre is active) */}
      <AnimatePresence>
        {activeFilter === 'genre' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 flex-wrap overflow-hidden"
          >
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedGenre === g
                    ? 'bg-cyan-600/80 text-white'
                    : 'bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                }`}
              >
                {g}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Track list / grid */}
      {isLoading ? (
        view === 'list' ? (
          <div className="space-y-1">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5">
                <Skeleton variant="rect" width={32} height={32} className="flex-shrink-0 rounded-lg" />
                <Skeleton variant="rect" width={40} height={40} className="flex-shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="rect" height={12} className="w-1/2 rounded-full" />
                  <Skeleton variant="rect" height={10} className="w-1/4 rounded-full" />
                </div>
                <Skeleton variant="rect" width={32} height={10} className="rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => <Skeleton key={i} variant="card" />)}
          </div>
        )
      ) : displayedTracks.length === 0 ? (
        <EmptyState
          icon={Music2}
          title="No tracks found"
          description={query ? `No results for "${query}". Try a different search.` : 'No tracks available.'}
          action={query ? { label: 'Clear search', onClick: clearSearch } : undefined}
        />
      ) : view === 'list' ? (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}
          className="space-y-0.5"
        >
          {displayedTracks.map((track, idx) => (
            <motion.div
              key={track.id}
              variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
            >
              <TrackCard
                track={track}
                index={idx}
                showIndex
                onAddToQueue={(t) => usePlayerStore.getState().addToQueue(t)}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {displayedTracks.map((track, idx) => (
            <TrackGridTile key={track.id} track={track} index={idx} />
          ))}
        </div>
      )}

      {/* Load more */}
      {!isLoading && hasMore && displayedTracks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center pt-4"
        >
          <Button variant="secondary" onClick={loadMore}>
            Load more tracks
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default TracksPage;
