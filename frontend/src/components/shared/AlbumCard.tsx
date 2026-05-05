import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Music } from 'lucide-react';
import { clsx } from 'clsx';
import type { Album } from '@/types';

interface AlbumCardProps {
  album: Album;
  onClick?: (album: Album) => void;
  onPlay?: (album: Album) => void;
  className?: string;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  onClick,
  onPlay,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => onClick?.(album)}
      className={clsx(
        'group flex flex-col gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] cursor-pointer',
        'hover:bg-white/[0.06] hover:border-white/10 transition-colors duration-200',
        isHovered && 'shadow-2xl shadow-black/40',
        className
      )}
    >
      {/* Cover art */}
      <div className="relative aspect-square rounded-xl overflow-hidden">
        {album.coverUrl ? (
          <img
            src={album.coverUrl}
            alt={album.title}
            className={clsx(
              'w-full h-full object-cover transition-transform duration-500',
              isHovered && 'scale-105'
            )}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-900/50 to-cyan-900/30 flex items-center justify-center">
            <Music className="w-10 h-10 text-white/20" />
          </div>
        )}

        {/* Hover overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-between p-3"
            >
              <span className="text-xs text-white/70 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                {album.trackCount ?? 0} tracks
              </span>

              <motion.button
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay?.(album);
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
          {album.title}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <span className="truncate">{typeof album.artist === 'string' ? album.artist : (album.artist as { name?: string })?.name}</span>
          {album.releaseYear && (
            <>
              <span className="text-white/20">•</span>
              <span className="flex-shrink-0">{album.releaseYear}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
