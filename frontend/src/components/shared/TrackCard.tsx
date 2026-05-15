import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  MoreHorizontal,
  Heart,
  ListPlus,
  PlusCircle,
  Radio,
  Pencil,
  Trash2,
} from 'lucide-react';
import { SimilarTracksModal } from '@/components/shared/SimilarTracksModal';
import { AddToPlaylistModal } from '@/components/shared/AddToPlaylistModal';
import { clsx } from 'clsx';
import { AudioWaveform } from '@/components/ui/AudioWaveform';
import { usePlayerStore } from '@/store/playerStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import type { Track } from '@/types';

interface TrackCardProps {
  track: Track;
  queue?: Track[];
  index?: number;
  showIndex?: boolean;
  showSimilarButton?: boolean;
  onPlay?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  onLike?: (track: Track) => void;
  onEdit?: (track: Track) => void;
  onDelete?: (track: Track) => void;
  className?: string;
}

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  queue,
  index,
  showIndex = false,
  showSimilarButton = false,
  onPlay,
  onAddToQueue,
  onAddToPlaylist,
  onLike,
  onEdit,
  onDelete,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [similarOpen, setSimilarOpen] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuOpen]);

  const { currentTrack, isPlaying, togglePlay, playTrack, addToQueue } = usePlayerStore();
  const { isLiked, toggle: toggleFav } = useFavoritesStore();
  const isActive = currentTrack?.id === track.id;
  const liked = isLiked(track.id);

  const handlePlay = () => {
    if (isActive) {
      togglePlay();
    } else {
      playTrack(track, queue ?? [track]);
      onPlay?.(track);
    }
  };

  return (
    <>
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={clsx(
  'group flex items-center gap-3 p-2.5 rounded-xl transition-colors duration-200 cursor-pointer relative',
  isActive
    ? 'bg-violet-500/10 border border-violet-500/20'
    : 'hover:bg-white/5 border border-transparent',
  menuOpen ? 'z-50' : 'z-0',
  className
)}
    >
      {/* Index / Playing indicator */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isActive && isPlaying ? (
            <motion.div
              key="waveform"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <AudioWaveform playing={true} variant="small" color="#8b5cf6" />
            </motion.div>
          ) : isHovered || isActive ? (
            <motion.button
              key="play"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handlePlay}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              {isActive && !isPlaying ? (
                <Pause className="w-3.5 h-3.5 text-white" />
              ) : (
                <Play className="w-3.5 h-3.5 text-white fill-white" />
              )}
            </motion.button>
          ) : showIndex && index !== undefined ? (
            <motion.span
              key="index"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-white/30 font-medium"
            >
              {index + 1}
            </motion.span>
          ) : (
            <motion.button
              key="play-default"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handlePlay}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Play className="w-3.5 h-3.5 text-white fill-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Album art */}
      <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden">
        <img
          src={track.coverUrl || '/placeholder-cover.svg'}
          alt={track.album}
          className={clsx(
            'w-full h-full object-cover transition-transform duration-300',
            isActive && 'scale-110'
          )}
        />
        {isActive && (
          <div className="absolute inset-0 bg-violet-900/30" />
        )}
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            'text-sm font-medium truncate transition-colors duration-200',
            isActive ? 'text-violet-400' : 'text-white group-hover:text-white'
          )}
        >
          {track.title}
        </p>
        <p className="text-xs text-white/40 truncate mt-0.5">
          {typeof track.artist === 'string' ? track.artist : (track.artist as { name?: string })?.name}
        </p>
      </div>

      {/* Duration + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-white/30 tabular-nums">
          {formatDuration(track.duration)}
        </span>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); toggleFav(track); onLike?.(track); }}
          className={clsx(
            'w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200',
            liked
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 hover:bg-white/10'
          )}
        >
          <Heart
            className={clsx(
              'w-3.5 h-3.5 transition-colors',
              liked ? 'fill-pink-400 text-pink-400' : 'text-white/40 hover:text-pink-400'
            )}
          />
        </motion.button>

        {showSimilarButton && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); setSimilarOpen(true); }}
            title="Similar tracks"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-violet-400 hover:bg-white/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <Radio className="w-3.5 h-3.5" />
          </motion.button>
        )}

        <div className="relative" ref={menuRef}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className={clsx(
              'w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/80 hover:bg-white/10 transition-all duration-200',
              isHovered || menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            <MoreHorizontal className="w-4 h-4" />
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute right-0 top-9 z-50 w-44 bg-[#1a1a2e] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
              >
                {[
  {
    label: 'Add to Queue',
    icon: ListPlus,
    action: () => { addToQueue(track); onAddToQueue?.(track); },
  },
  {
    label: 'Add to Playlist',
    icon: PlusCircle,
    action: () => {
      onAddToPlaylist?.(track);
      setPlaylistModalOpen(true);
    },
  },
  {
    label: liked ? 'Unlike' : 'Like',
    icon: Heart,
    action: () => {
      toggleFav(track);
      onLike?.(track);
    },
  },
  ...(onEdit
    ? [
        {
          label: 'Edit',
          icon: Pencil,
          action: () => onEdit(track),
        },
      ]
    : []),
  ...(onDelete
    ? [
        {
          label: 'Delete',
          icon: Trash2,
          action: () => onDelete(track),
        },
      ]
    : []),
].map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    onClick={(e) => {
                      e.stopPropagation();
                      action();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors duration-150"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>

    {showSimilarButton && (
      <SimilarTracksModal
        trackId={track.id}
        isOpen={similarOpen}
        onClose={() => setSimilarOpen(false)}
      />
    )}
    <AddToPlaylistModal
      track={playlistModalOpen ? track : null}
      onClose={() => setPlaylistModalOpen(false)}
    />
    </>
  );
};
