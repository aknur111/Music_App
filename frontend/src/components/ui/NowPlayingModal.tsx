import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
} from 'lucide-react';
import { clsx } from 'clsx';
import { usePlayerStore } from '@/store/playerStore';
import { AudioWaveform } from './AudioWaveform';

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const NowPlayingModal: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    repeat,
    shuffle,
    currentTime,
    duration,
    progress,
    dominantColor,
    isFullscreen,
    togglePlay,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    nextTrack,
    prevTrack,
    seekTo,
    toggleFullscreen,
  } = usePlayerStore();

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seekTo(ratio * duration);
  };

  const effectiveVolume = isMuted ? 0 : volume;
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;

  return (
    <AnimatePresence>
      {isFullscreen && currentTrack && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden"
        >
          {/* Ambient background */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 30% 40%, ${dominantColor}40 0%, transparent 55%),
                           radial-gradient(ellipse at 70% 60%, rgba(6,182,212,0.15) 0%, transparent 50%),
                           #06060e`,
            }}
          />

          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

          {/* Close button */}
          <div className="relative z-10 flex justify-end p-6 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleFullscreen}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-8 px-8 pb-8">
            {/* Album art — large rotating */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 25, delay: 0.1 }}
              className="relative"
            >
              <div
                className="w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden"
                style={{
                  boxShadow: `0 30px 80px ${dominantColor}50, 0 0 0 1px rgba(255,255,255,0.08)`,
                }}
              >
                <motion.img
                  src={currentTrack.coverUrl || '/placeholder-cover.png'}
                  alt={typeof currentTrack.album === 'string' ? currentTrack.album : (currentTrack.album as { title?: string })?.title ?? ''}
                  className="w-full h-full object-cover"
                  animate={{ rotate: isPlaying ? 360 : 0 }}
                  transition={
                    isPlaying
                      ? { duration: 25, repeat: Infinity, ease: 'linear' }
                      : { duration: 0.5 }
                  }
                />
              </div>
              {/* Reflection */}
              <div
                className="absolute top-full left-0 right-0 h-24 opacity-20 blur-sm"
                style={{
                  background: `linear-gradient(to bottom, ${dominantColor}40, transparent)`,
                  transform: 'scaleY(-1)',
                }}
              />
            </motion.div>

            {/* Track info */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col items-center gap-1.5 text-center w-full max-w-md"
            >
              <div className="flex items-center gap-3 w-full justify-center">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight truncate max-w-xs">
                  {currentTrack.title}
                </h1>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-white/30 hover:text-pink-400 transition-colors duration-200 flex-shrink-0"
                >
                  <Heart className="w-5 h-5" />
                </motion.button>
              </div>
              <p className="text-base text-white/50">{typeof currentTrack.artist === 'string' ? currentTrack.artist : (currentTrack.artist as { name?: string })?.name}</p>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-md flex flex-col gap-2"
            >
              <div
                onClick={handleProgressClick}
                className="relative h-1.5 group cursor-pointer w-full"
              >
                <div className="absolute inset-0 rounded-full bg-white/10" />
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                  style={{
                    width: `${progress * 100}%`,
                    background: `linear-gradient(90deg, ${dominantColor}, #06b6d4)`,
                    boxShadow: `0 0 8px ${dominantColor}80`,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ left: `calc(${progress * 100}% - 7px)` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/35 tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </motion.div>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-8"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleShuffle}
                className={clsx(
                  'transition-colors duration-200',
                  shuffle ? 'text-violet-400' : 'text-white/40 hover:text-white/80'
                )}
              >
                <Shuffle className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevTrack}
                className="text-white/70 hover:text-white transition-colors duration-200"
              >
                <SkipBack className="w-7 h-7 fill-current" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePlay}
                className="relative w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${dominantColor}, #7c3aed)`,
                  boxShadow: `0 0 30px ${dominantColor}60, 0 8px 32px rgba(0,0,0,0.4)`,
                }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: `${dominantColor}30` }}
                  animate={isPlaying ? { scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] } : {}}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
                <AnimatePresence mode="wait">
                  {isPlaying ? (
                    <motion.div
                      key="pause"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                    >
                      <Pause className="w-7 h-7 text-white fill-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="play"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                    >
                      <Play className="w-7 h-7 text-white fill-white ml-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextTrack}
                className="text-white/70 hover:text-white transition-colors duration-200"
              >
                <SkipForward className="w-7 h-7 fill-current" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleRepeat}
                className={clsx(
                  'transition-colors duration-200',
                  repeat !== 'none' ? 'text-violet-400' : 'text-white/40 hover:text-white/80'
                )}
              >
                {repeat === 'one' ? (
                  <Repeat1 className="w-5 h-5" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </motion.button>
            </motion.div>

            {/* Waveform visualizer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col items-center gap-4"
            >
              <AudioWaveform
                playing={isPlaying}
                variant="large"
                color={dominantColor}
                barCount={40}
                className="opacity-60"
              />
            </motion.div>

            {/* Volume */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMute}
                className="text-white/40 hover:text-white/80 transition-colors duration-200"
              >
                <VolumeIcon className="w-4 h-4" />
              </motion.button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={effectiveVolume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-32 h-1 accent-violet-500 cursor-pointer"
              />
            </motion.div>

            {/* Lyrics placeholder */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="w-full max-w-md mt-2"
            >
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/20 mb-3">
                  Lyrics
                </p>
                <p className="text-sm text-white/25 italic">
                  Lyrics not available for this track.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
