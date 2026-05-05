import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  ListMusic,
  Maximize2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { usePlayerStore } from '@/store/playerStore';
import { AudioWaveform } from '@/components/ui/AudioWaveform';

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const PlayerBar: React.FC = () => {
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
    isQueueOpen,
    dominantColor,
    togglePlay,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    nextTrack,
    prevTrack,
    seekTo,
    toggleQueue,
    toggleFullscreen,
  } = usePlayerStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  const displayProgress = isDragging ? dragProgress : progress;
  const displayTime = isDragging ? dragProgress * duration : currentTime;

  const getProgressFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent, ref: React.RefObject<HTMLDivElement>): number => {
      if (!ref.current) return 0;
      const rect = ref.current.getBoundingClientRect();
      const x = (e as MouseEvent).clientX - rect.left;
      return Math.max(0, Math.min(1, x / rect.width));
    },
    []
  );

  const handleProgressMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const p = getProgressFromEvent(e, progressBarRef);
    setDragProgress(p);

    const onMove = (ev: MouseEvent) => {
      const p2 = getProgressFromEvent(ev, progressBarRef);
      setDragProgress(p2);
    };
    const onUp = (ev: MouseEvent) => {
      const p3 = getProgressFromEvent(ev, progressBarRef);
      seekTo(p3 * duration);
      setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleVolumeMouseDown = (e: React.MouseEvent) => {
    setIsDraggingVolume(true);
    const v = getProgressFromEvent(e, volumeBarRef);
    setVolume(v);

    const onMove = (ev: MouseEvent) => setVolume(getProgressFromEvent(ev, volumeBarRef));
    const onUp = () => {
      setIsDraggingVolume(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const effectiveVolume = isMuted ? 0 : volume;
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Top animated gradient border */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${dominantColor}cc, rgba(6,182,212,0.5), ${dominantColor}cc, transparent)`,
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-[#0d0d1a]/90 backdrop-blur-2xl border-t border-white/[0.06]" />

      {/* Ambient glow behind album art */}
      {currentTrack && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-80 pointer-events-none"
          animate={{
            background: `radial-gradient(ellipse at left center, ${dominantColor}18 0%, transparent 70%)`,
          }}
          transition={{ duration: 1 }}
        />
      )}

      <div className="relative z-10 flex items-center gap-4 px-5 h-[72px]">
        {/* LEFT: Track info */}
        <div className="flex items-center gap-3 w-64 min-w-0 flex-shrink-0">
          <AnimatePresence mode="wait">
            {currentTrack ? (
              <motion.div
                key={currentTrack.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative flex-shrink-0"
              >
                <div
                  className="w-12 h-12 rounded-xl overflow-hidden"
                  style={{
                    boxShadow: `0 0 20px ${dominantColor}40`,
                  }}
                >
                  <motion.img
                    src={currentTrack.coverUrl || '/placeholder-cover.png'}
                    alt={typeof currentTrack.album === 'string' ? currentTrack.album : (currentTrack.album as { title?: string })?.title ?? ''}
                    className="w-full h-full object-cover"
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={
                      isPlaying
                        ? { duration: 20, repeat: Infinity, ease: 'linear' }
                        : { duration: 0.5 }
                    }
                  />
                </div>
              </motion.div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/5 flex-shrink-0" />
            )}
          </AnimatePresence>

          <div className="min-w-0 flex-1">
            {currentTrack ? (
              <>
                <div className="overflow-hidden">
                  <motion.p
                    key={currentTrack.id + '-title'}
                    animate={
                      currentTrack.title.length > 20
                        ? { x: [0, -100, 0] }
                        : {}
                    }
                    transition={
                      currentTrack.title.length > 20
                        ? { duration: 8, repeat: Infinity, ease: 'linear', repeatDelay: 2 }
                        : {}
                    }
                    className="text-sm font-semibold text-white whitespace-nowrap"
                  >
                    {currentTrack.title}
                  </motion.p>
                </div>
                <p className="text-xs text-white/40 truncate mt-0.5">
                  {typeof currentTrack.artist === 'string' ? currentTrack.artist : (currentTrack.artist as { name?: string })?.name}
                </p>
              </>
            ) : (
              <p className="text-sm text-white/25">Not playing</p>
            )}
          </div>

          {/* Waveform indicator */}
          {currentTrack && (
            <div className="flex-shrink-0 opacity-60">
              <AudioWaveform playing={isPlaying} variant="small" color={dominantColor} />
            </div>
          )}
        </div>

        {/* CENTER: Controls + Progress */}
        <div className="flex-1 flex flex-col items-center gap-1.5 max-w-xl mx-auto">
          {/* Controls row */}
          <div className="flex items-center gap-5">
            {/* Shuffle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleShuffle}
              className={clsx(
                'text-white/40 hover:text-white/80 transition-colors duration-200 relative',
                shuffle && 'text-violet-400 hover:text-violet-300'
              )}
            >
              <Shuffle className="w-4 h-4" />
              {shuffle && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-400 rounded-full" />
              )}
            </motion.button>

            {/* Prev */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevTrack}
              className="text-white/60 hover:text-white transition-colors duration-200"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </motion.button>

            {/* Play/Pause */}
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={togglePlay}
              className="relative w-11 h-11 rounded-full bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-lg shadow-violet-900/50"
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-violet-400/30"
                animate={isPlaying ? { scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <AnimatePresence mode="wait">
                {isPlaying ? (
                  <motion.div
                    key="pause"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    <Pause className="w-5 h-5 text-white fill-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="play"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Next */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextTrack}
              className="text-white/60 hover:text-white transition-colors duration-200"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </motion.button>

            {/* Repeat */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleRepeat}
              className={clsx(
                'text-white/40 hover:text-white/80 transition-colors duration-200 relative',
                repeat !== 'none' && 'text-violet-400 hover:text-violet-300'
              )}
            >
              {repeat === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
              {repeat !== 'none' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-400 rounded-full" />
              )}
            </motion.button>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2.5 w-full">
            <span className="text-[10px] text-white/35 tabular-nums w-8 text-right flex-shrink-0">
              {formatTime(displayTime)}
            </span>

            <div
              ref={progressBarRef}
              onMouseDown={handleProgressMouseDown}
              className="flex-1 relative h-1 group cursor-pointer"
            >
              {/* Track background */}
              <div className="absolute inset-0 rounded-full bg-white/10" />

              {/* Buffered (fake) */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/15"
                style={{ width: `${Math.min(displayProgress + 0.15, 1) * 100}%` }}
              />

              {/* Filled gradient */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${displayProgress * 100}%`,
                  background: `linear-gradient(90deg, ${dominantColor}, #06b6d4)`,
                  boxShadow: `0 0 6px ${dominantColor}80`,
                }}
              />

              {/* Scrubber knob */}
              <motion.div
                className={clsx(
                  'absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg shadow-black/50',
                  'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                  isDragging && 'opacity-100 scale-125'
                )}
                style={{ left: `calc(${displayProgress * 100}% - 6px)` }}
                animate={{ scale: isDragging ? 1.25 : 1 }}
              />
            </div>

            <span className="text-[10px] text-white/35 tabular-nums w-8 flex-shrink-0">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* RIGHT: Volume + extras */}
        <div className="flex items-center gap-3 w-64 justify-end flex-shrink-0">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              className="text-white/40 hover:text-white/80 transition-colors duration-200"
            >
              <VolumeIcon className="w-4 h-4" />
            </motion.button>

            <div
              ref={volumeBarRef}
              onMouseDown={handleVolumeMouseDown}
              className="relative w-20 h-1 group cursor-pointer"
            >
              <div className="absolute inset-0 rounded-full bg-white/10" />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                style={{ width: `${effectiveVolume * 100}%` }}
              />
              <div
                className={clsx(
                  'absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-sm',
                  'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                  isDraggingVolume && 'opacity-100'
                )}
                style={{ left: `calc(${effectiveVolume * 100}% - 5px)` }}
              />
            </div>
          </div>

          {/* Queue toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleQueue}
            className={clsx(
              'text-white/40 hover:text-white/80 transition-colors duration-200',
              isQueueOpen && 'text-violet-400 hover:text-violet-300'
            )}
            title="Queue"
          >
            <ListMusic className="w-4 h-4" />
          </motion.button>

          {/* Fullscreen */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFullscreen}
            className="text-white/40 hover:text-white/80 transition-colors duration-200"
            title="Expand"
          >
            <Maximize2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
