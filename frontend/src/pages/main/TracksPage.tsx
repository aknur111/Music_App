import React, { useEffect, useState, useCallback, useRef, useMemo, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  Music2,
  ChevronDown,
  Plus,
  LoaderCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { MusicService } from '@/services/music.service';
import { TrackCard } from '@/components/shared/TrackCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import type { Track, Artist, Album } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortOption = 'popular' | 'newest' | 'az';
type FilterChip = 'all' | 'genre' | 'artist';
type ViewMode = 'list' | 'grid';

const SORT_LABELS: Record<SortOption, string> = {
  popular: 'Most Popular',
  newest: 'Newest',
  az: 'A – Z',
};

const PAGE_SIZE = 20;

// ─── Track Grid Card (compact grid tile) ─────────────────────────────────────

interface TrackGridTileProps {
  track: Track;
  index: number;
  queue: Track[];
}

const TrackGridTile: React.FC<TrackGridTileProps> = ({ track, index, queue }) => {
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
      onClick={() => isActive ? togglePlay() : playTrack(track, queue)}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuthStore();

  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [displayedTracks, setDisplayedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [sort, setSort] = useState<SortOption>('popular');
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);

  // Create Song modal
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    title: '',
    artist_id: '',
    album_id: '',
    duration_s: '180',
    genre: '',
  });

    // Upload Song modal
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadForm, setUploadForm] = useState({
    title: '',
    artist_id: '',
    album_id: '',
    duration_s: '180',
    genre: '',
  });

  // Edit Song modal
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    album_id: '',
    duration_s: '180',
    genre: '',
  });

  // Delete Song modal
  const [deletingTrack, setDeletingTrack] = useState<Track | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Sync query from URL params (e.g. when TopBar search navigates here)
  useEffect(() => {
    const urlQuery = searchParams.get('q') ?? '';
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
      setPage(1);
      setActiveFilter('all');
    }
  }, [searchParams]);

  // Initial load
  useEffect(() => {
    async function loadPage() {
      setLoading(true);

      const [tracksResult, artistsResult, albumsResult] = await Promise.allSettled([
        MusicService.getTracks(1, 200),
        MusicService.getArtists(),
        MusicService.getAlbums(),
      ]);

      if (tracksResult.status === 'fulfilled') {
        const tracks = tracksResult.value;
        setAllTracks(tracks);
        setDisplayedTracks(tracks.slice(0, PAGE_SIZE));
        setHasMore(tracks.length > PAGE_SIZE);
      }

      if (artistsResult.status === 'fulfilled') {
        setArtists(artistsResult.value);
      }

      if (albumsResult.status === 'fulfilled') {
        setAlbums(albumsResult.value);
      }

      setLoading(false);
    }

    loadPage();
  }, []);

  // Derived genre + artist lists
  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    allTracks.forEach((t) => { if (t.genre && t.genre !== 'Unknown') genres.add(t.genre); });
    return ['All', ...Array.from(genres).sort()];
  }, [allTracks]);

  const uniqueArtists = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    allTracks.forEach((t) => {
      const a = typeof t.artist === 'string' ? t.artist : '';
      if (a && !seen.has(a)) { seen.add(a); result.push(a); }
    });
    return result.sort();
  }, [allTracks]);

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
      let base = allTracks;
      if (activeFilter === 'genre' && selectedGenre !== 'All') {
        base = allTracks.filter((t) => t.genre === selectedGenre);
      } else if (activeFilter === 'artist' && selectedArtist) {
        base = allTracks.filter((t) => t.artist === selectedArtist);
      }
      const sorted = sortTracks(base, sort);
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

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, sort, selectedGenre, selectedArtist, activeFilter, allTracks, page, sortTracks]);

  const loadMore = () => setPage((p) => p + 1);

  const clearSearch = () => {
    setQuery('');
    setSearchParams({});
    setPage(1);
  };

  const handleFilterChange = (id: FilterChip) => {
    setActiveFilter(id);
    if (id !== 'genre') setSelectedGenre('All');
    if (id !== 'artist') setSelectedArtist(null);
    setPage(1);
  };

  // ─── Create Song ────────────────────────────────────────────────────────────

  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      artist_id: '',
      album_id: '',
      duration_s: '180',
      genre: '',
    });
    setCreateError('');
    setCreating(false);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    resetCreateForm();
  };

  const handleCreateSong = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError('');

    const title = createForm.title.trim();
    const duration = Number(createForm.duration_s);

    if (!title) {
      setCreateError('Song title is required.');
      return;
    }

    if (!createForm.artist_id) {
      setCreateError('Please select an artist.');
      return;
    }

    if (!createForm.album_id) {
      setCreateError('Please select an album.');
      return;
    }

    if (!Number.isInteger(duration) || duration <= 0) {
      setCreateError('Duration must be a positive number of seconds.');
      return;
    }

    setCreating(true);

    try {
      const createdTrack = await MusicService.createSong({
        title,
        artist_id: createForm.artist_id,
        album_id: createForm.album_id,
        duration_s: duration,
        genre: createForm.genre.trim(),
      });

      const selectedArtist = artists.find(
        (artist) => artist.id === createForm.artist_id,
      );

      const selectedAlbum = albums.find(
        (album) => album.id === createForm.album_id,
      );

      const trackForUi: Track = {
        ...createdTrack,
        artist:
          selectedArtist?.name ||
          createdTrack.artist ||
          createForm.artist_id,
        album:
          selectedAlbum?.title ||
          createdTrack.album ||
          'Unknown Album',
      };

      const nextTracks = [trackForUi, ...allTracks];

      setAllTracks(nextTracks);
      setDisplayedTracks(
        sortTracks(nextTracks, sort).slice(0, page * PAGE_SIZE),
      );
      setHasMore(nextTracks.length > page * PAGE_SIZE);

      closeCreateModal();
    } catch (error) {
      console.error('Create song failed:', error);
      setCreateError('Failed to create song. Please try again.');
      setCreating(false);
    }
  };

    // ─── Upload Song ────────────────────────────────────────────────────────────

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      artist_id: '',
      album_id: '',
      duration_s: '180',
      genre: '',
    });
    setUploadError('');
    setUploading(false);
  };

  const closeUploadModal = () => {
    setUploadOpen(false);
    resetUploadForm();
  };

  const handleUploadSong = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError('');

    const title = uploadForm.title.trim();
    const duration = Number(uploadForm.duration_s);

    if (!user?.id) {
      setUploadError('User profile is not loaded. Please sign in again.');
      return;
    }

    if (!title) {
      setUploadError('Song title is required.');
      return;
    }

    if (!uploadForm.artist_id) {
      setUploadError('Please select an artist.');
      return;
    }

    if (!uploadForm.album_id) {
      setUploadError('Please select an album.');
      return;
    }

    if (!Number.isInteger(duration) || duration <= 0) {
      setUploadError('Duration must be a positive number of seconds.');
      return;
    }

    setUploading(true);

    try {
      const uploadedTrack = await MusicService.uploadSong({
        title,
        artist_id: uploadForm.artist_id,
        album_id: uploadForm.album_id,
        duration_s: duration,
        genre: uploadForm.genre.trim(),
        uploader_id: user.id,
      });

      const selectedArtist = artists.find(
        (artist) => artist.id === uploadForm.artist_id,
      );

      const selectedAlbum = albums.find(
        (album) => album.id === uploadForm.album_id,
      );

      const trackForUi: Track = {
        ...uploadedTrack,
        artist:
          selectedArtist?.name ||
          uploadedTrack.artist ||
          uploadForm.artist_id,
        album:
          selectedAlbum?.title ||
          uploadedTrack.album ||
          'Unknown Album',
      };

      const nextTracks = [trackForUi, ...allTracks];

      setAllTracks(nextTracks);
      setDisplayedTracks(
        sortTracks(nextTracks, sort).slice(0, page * PAGE_SIZE),
      );
      setHasMore(nextTracks.length > page * PAGE_SIZE);

      closeUploadModal();
    } catch (error) {
      console.error('Upload song failed:', error);
      setUploadError('Failed to upload song. Please try again.');
      setUploading(false);
    }
  };

  // ─── Edit Song ──────────────────────────────────────────────────────────────

  const openEditModal = (track: Track) => {
    setEditingTrack(track);
    setEditForm({
      title: track.title,
      album_id: track.albumId || '',
      duration_s: String(track.duration || 180),
      genre: track.genre || '',
    });
    setEditError('');
    setUpdating(false);
  };

  const closeEditModal = () => {
    setEditingTrack(null);
    setEditError('');
    setUpdating(false);
  };

  const handleUpdateSong = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingTrack) return;

    setEditError('');

    const title = editForm.title.trim();
    const duration = Number(editForm.duration_s);

    if (!title) {
      setEditError('Song title is required.');
      return;
    }

    if (!editForm.album_id) {
      setEditError('Please select an album.');
      return;
    }

    if (!Number.isInteger(duration) || duration <= 0) {
      setEditError('Duration must be a positive number of seconds.');
      return;
    }

    setUpdating(true);

    try {
      const updatedTrack = await MusicService.updateSong(editingTrack.id, {
        title,
        album_id: editForm.album_id,
        duration_s: duration,
        genre: editForm.genre.trim(),
      });

      const selectedAlbum = albums.find(
        (album) => album.id === editForm.album_id,
      );

      const trackForUi: Track = {
        ...editingTrack,
        ...updatedTrack,
        title: updatedTrack.title || title,
        artist: editingTrack.artist,
        artistId: editingTrack.artistId,
        album: selectedAlbum?.title || editingTrack.album || updatedTrack.album,
        albumId: editForm.album_id,
        duration,
        genre: editForm.genre.trim() || updatedTrack.genre || editingTrack.genre,
        coverUrl: editingTrack.coverUrl,
        audioUrl: editingTrack.audioUrl,
        playCount: editingTrack.playCount,
        likeCount: editingTrack.likeCount,
        isLiked: editingTrack.isLiked,
        createdAt: editingTrack.createdAt,
        updatedAt: new Date().toISOString(),
      };

      setAllTracks((prev) =>
        prev.map((track) =>
          track.id === editingTrack.id ? trackForUi : track,
        ),
      );

      setDisplayedTracks((prev) =>
        prev.map((track) =>
          track.id === editingTrack.id ? trackForUi : track,
        ),
      );

      closeEditModal();
    } catch (error) {
      console.error('Update song failed:', error);
      setEditError('Failed to update song. Please try again.');
      setUpdating(false);
    }
  };

  // ─── Delete Song ────────────────────────────────────────────────────────────

  const openDeleteModal = (track: Track) => {
    setDeletingTrack(track);
    setDeleteError('');
    setDeleting(false);
  };

  const closeDeleteModal = () => {
    setDeletingTrack(null);
    setDeleteError('');
    setDeleting(false);
  };

  const handleDeleteSong = async () => {
    if (!deletingTrack) return;

    setDeleting(true);
    setDeleteError('');

    try {
      await MusicService.deleteSong(deletingTrack.id);

      setAllTracks((prev) =>
        prev.filter((track) => track.id !== deletingTrack.id),
      );

      setDisplayedTracks((prev) =>
        prev.filter((track) => track.id !== deletingTrack.id),
      );

      closeDeleteModal();
    } catch (error) {
      console.error('Delete song failed:', error);
      setDeleteError('Failed to delete song. Please try again.');
      setDeleting(false);
    }
  };

  const filterChips: { id: FilterChip; label: string }[] = [
    { id: 'all', label: 'All Tracks' },
    { id: 'genre', label: 'By Genre' },
    { id: 'artist', label: 'By Artist' },
  ];

  const isLoading = loading || searchLoading;

  return (
    <>
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
            <Button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Song
            </Button>

            <Button
  variant="secondary"
  onClick={() => setUploadOpen(true)}
  className="flex items-center gap-2"
>
  <Plus className="w-4 h-4" />
  Upload Song
</Button>

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
              onClick={() => handleFilterChange(chip.id)}
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

        {/* Genre pills */}
        <AnimatePresence>
          {activeFilter === 'genre' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 flex-wrap overflow-hidden"
            >
              {availableGenres.map((g) => (
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

        {/* Artist pills */}
        <AnimatePresence>
          {activeFilter === 'artist' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 flex-wrap overflow-hidden max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
            >
              <button
                onClick={() => setSelectedArtist(null)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  !selectedArtist
                    ? 'bg-cyan-600/80 text-white'
                    : 'bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                }`}
              >
                All Artists
              </button>
              {uniqueArtists.map((artist) => (
                <button
                  key={artist}
                  onClick={() => setSelectedArtist(artist)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedArtist === artist
                      ? 'bg-cyan-600/80 text-white'
                      : 'bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                  }`}
                >
                  {artist}
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
                  queue={displayedTracks}
                  index={idx}
                  showIndex
                  onAddToQueue={(t) => usePlayerStore.getState().addToQueue(t)}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayedTracks.map((track, idx) => (
              <TrackGridTile key={track.id} track={track} index={idx} queue={displayedTracks} />
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

      {/* Create Song Modal */}
      <AnimatePresence>
        {createOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeCreateModal}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 28,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-[#13131f] border border-white/[0.08] shadow-2xl shadow-black/70 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Create Song
                  </h2>
                  <p className="text-sm text-white/40 mt-0.5">
                    Add a new track to the catalog
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSong} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Song title
                  </label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Sacrifice"
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Artist
                  </label>
                  <select
                    value={createForm.artist_id}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        artist_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                  >
                    <option value="" className="bg-[#13131f]">
                      Select artist
                    </option>
                    {artists.map((artist) => (
                      <option
                        key={artist.id}
                        value={artist.id}
                        className="bg-[#13131f]"
                      >
                        {artist.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Album
                  </label>
                  <select
                    value={createForm.album_id}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        album_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                  >
                    <option value="" className="bg-[#13131f]">
                      Select album
                    </option>
                    {albums.map((album) => (
                      <option
                        key={album.id}
                        value={album.id}
                        className="bg-[#13131f]"
                      >
                        {album.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Duration, sec
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={createForm.duration_s}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          duration_s: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Genre
                    </label>
                    <input
                      type="text"
                      value={createForm.genre}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          genre: e.target.value,
                        }))
                      }
                      placeholder="Synth-pop"
                      className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                    />
                  </div>
                </div>

                {createError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {createError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    Cancel
                  </button>

                  <Button
                    type="submit"
                    disabled={
                      creating ||
                      artists.length === 0 ||
                      albums.length === 0
                    }
                    className="flex items-center gap-2"
                  >
                    {creating && (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    )}
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

            {/* Upload Song Modal */}
      <AnimatePresence>
        {uploadOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeUploadModal}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 28,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-[#13131f] border border-white/[0.08] shadow-2xl shadow-black/70 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Upload Song
                  </h2>
                  <p className="text-sm text-white/40 mt-0.5">
                    Add a user-submitted track with uploader metadata
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUploadSong} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Song title
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="My uploaded track"
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Artist
                  </label>
                  <select
                    value={uploadForm.artist_id}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        artist_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                  >
                    <option value="" className="bg-[#13131f]">
                      Select artist
                    </option>
                    {artists.map((artist) => (
                      <option
                        key={artist.id}
                        value={artist.id}
                        className="bg-[#13131f]"
                      >
                        {artist.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Album
                  </label>
                  <select
                    value={uploadForm.album_id}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        album_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                  >
                    <option value="" className="bg-[#13131f]">
                      Select album
                    </option>
                    {albums.map((album) => (
                      <option
                        key={album.id}
                        value={album.id}
                        className="bg-[#13131f]"
                      >
                        {album.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Duration, sec
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={uploadForm.duration_s}
                      onChange={(e) =>
                        setUploadForm((prev) => ({
                          ...prev,
                          duration_s: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Genre
                    </label>
                    <input
                      type="text"
                      value={uploadForm.genre}
                      onChange={(e) =>
                        setUploadForm((prev) => ({
                          ...prev,
                          genre: e.target.value,
                        }))
                      }
                      placeholder="Indie"
                      className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                    />
                  </div>
                </div>

                {uploadError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {uploadError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeUploadModal}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    Cancel
                  </button>

                  <Button
                    type="submit"
                    disabled={
                      uploading ||
                      artists.length === 0 ||
                      albums.length === 0
                    }
                    className="flex items-center gap-2"
                  >
                    {uploading && (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    )}
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Song Modal */}
      <AnimatePresence>
        {editingTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeEditModal}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 28,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-[#13131f] border border-white/[0.08] shadow-2xl shadow-black/70 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-violet-300" />
                    Edit Song
                  </h2>
                  <p className="text-sm text-white/40 mt-0.5">
                    Update track metadata
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateSong} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Song title
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Album
                  </label>
                  <select
                    value={editForm.album_id}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        album_id: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                  >
                    <option value="" className="bg-[#13131f]">
                      Select album
                    </option>
                    {albums.map((album) => (
                      <option
                        key={album.id}
                        value={album.id}
                        className="bg-[#13131f]"
                      >
                        {album.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Duration, sec
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.duration_s}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          duration_s: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Genre
                    </label>
                    <input
                      type="text"
                      value={editForm.genre}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          genre: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition"
                    />
                  </div>
                </div>

                {editError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {editError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    Cancel
                  </button>

                  <Button
                    type="submit"
                    disabled={updating || albums.length === 0}
                    className="flex items-center gap-2"
                  >
                    {updating && (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    )}
                    {updating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Song Modal */}
      <AnimatePresence>
        {deletingTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeDeleteModal}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 28,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-[#13131f] border border-white/[0.08] shadow-2xl shadow-black/70 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Delete Song
                  </h2>
                  <p className="text-sm text-white/40 mt-0.5">
                    This action removes the track from the catalog.
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] px-4 py-3">
                  <p className="text-sm text-white/50">
                    You are about to delete:
                  </p>
                  <p className="text-base font-semibold text-white mt-1">
                    {deletingTrack.title}
                  </p>
                </div>

                {deleteError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {deleteError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    Cancel
                  </button>

                  <Button
                    type="button"
                    onClick={handleDeleteSong}
                    disabled={deleting}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500"
                  >
                    {deleting && (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    )}
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TracksPage;