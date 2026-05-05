import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Music2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { Playlist } from '@/types';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick?: (playlist: Playlist) => void;
  onPlay?: (playlist: Playlist) => void;
  className?: string;
}

const getMosaicCovers = (playlist: Playlist): string[] => {
  const tracks = playlist.tracks ?? [];
  return tracks
    .slice(0, 4)
    .map((t) => t.coverUrl)
    .filter(Boolean) as string[];
};

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  onClick,
  onPlay,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const covers = getMosaicCovers(playlist);

  const renderCover = () => {
    if (playlist.coverUrl) {
      return (
        <img
          src={playlist.coverUrl}
          alt={playlist.name}
          className={clsx(
            'w-full h-full object-cover transition-transform duration-500',
            isHovered && 'scale-105'
          )}
        />
      );
    }

    if (covers.length >= 4) {
      return (
        <div className="w-full h-full grid grid-cols-2 gap-0.5">
          {covers.slice(0, 4).map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className={clsx(
                'w-full h-full object-cover transition-transform duration-500',
                isHovered && 'scale-105'
              )}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-gradient-to-br from-violet-800/40 via-purple-800/30 to-cyan-800/20 flex items-center justify-center">
        <Music2 className="w-10 h-10 text-white/20" />
      </div>
    );
  };

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => onClick?.(playlist)}
      className={clsx(
        'group flex flex-col gap-3 p-3 rounded-2xl cursor-pointer',
        'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/10 transition-colors duration-200',
        isHovered && 'shadow-2xl shadow-black/40',
        className
      )}
    >
      {/* Cover */}
      <div className="relative aspect-square rounded-xl overflow-hidden">
        {renderCover()}

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-end p-3"
            >
              <motion.button
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay?.(playlist);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-900/60 transition-colors duration-200"
              >
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-semibold text-white truncate group-hover:text-violet-300 transition-colors duration-200">
          {playlist.name}
        </p>
        <p className="text-xs text-white/40 truncate">
          {(playlist.tracks?.length ?? playlist.trackIds?.length ?? 0)} tracks
        </p>
      </div>
    </motion.div>
  );
};
