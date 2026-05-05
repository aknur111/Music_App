import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { clsx } from 'clsx';
import type { Artist } from '@/types';

interface ArtistCardProps {
  artist: Artist;
  onClick?: (artist: Artist) => void;
  className?: string;
}

const formatFollowers = (count?: number): string => {
  if (!count) return '';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toString();
};

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onClick, className }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -3, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => onClick?.(artist)}
      className={clsx(
        'group flex flex-col items-center gap-3 p-4 rounded-2xl cursor-pointer',
        'bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-colors duration-200',
        className
      )}
    >
      {/* Avatar with glowing ring */}
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: isHovered
              ? '0 0 0 2px rgba(139, 92, 246, 0.8), 0 0 20px rgba(139, 92, 246, 0.4)'
              : '0 0 0 2px rgba(255,255,255,0.06)',
          }}
          transition={{ duration: 0.3 }}
        />
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-violet-800/40 to-cyan-800/30 flex items-center justify-center">
          {(artist.avatarUrl ?? (artist as { image?: string }).image) ? (
            <img
              src={(artist.avatarUrl ?? (artist as { image?: string }).image)!}
              alt={artist.name}
              className={clsx(
                'w-full h-full object-cover transition-transform duration-500',
                isHovered && 'scale-110'
              )}
            />
          ) : (
            <User className="w-9 h-9 text-white/30" />
          )}
        </div>
        {/* Ambient glow */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-full bg-violet-500/20 blur-lg -z-10 scale-125"
          />
        )}
      </div>

      {/* Name & followers */}
      <div className="flex flex-col items-center gap-0.5 text-center min-w-0 w-full">
        <p className="text-sm font-semibold text-white truncate w-full text-center group-hover:text-violet-300 transition-colors duration-200">
          {artist.name}
        </p>
        {artist.followerCount !== undefined && (
          <p className="text-xs text-white/40">
            {formatFollowers(artist.followerCount)} followers
          </p>
        )}
      </div>
    </motion.div>
  );
};
