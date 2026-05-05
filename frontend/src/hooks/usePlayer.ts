import { useEffect, useRef, useCallback, type MutableRefObject } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import type { Track } from '@/types'
import type { RepeatMode } from '@/store/playerStore'
import { getAudio } from '@/lib/audioEngine'

// ─── Return type ──────────────────────────────────────────────────────────────

export interface UsePlayerReturn {
  // State
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  volume: number
  isMuted: boolean
  repeat: RepeatMode
  shuffle: boolean
  currentTime: number
  duration: number
  progress: number
  isQueueOpen: boolean
  isFullscreen: boolean
  dominantColor: string

  // Controls
  playTrack: (track: Track, queue?: Track[]) => void
  pause: () => void
  resume: () => void
  togglePlay: () => void
  nextTrack: () => void
  prevTrack: () => void
  seekTo: (time: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  toggleRepeat: () => void
  toggleShuffle: () => void
  toggleQueue: () => void
  toggleFullscreen: () => void
  addToQueue: (track: Track) => void
  clearQueue: () => void

  // Raw audio ref for advanced consumers (e.g. visualisers)
  audioRef: MutableRefObject<HTMLAudioElement>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlayer(): UsePlayerReturn {
  // Stable ref to the singleton audio element
  const audioRef = useRef<HTMLAudioElement>(getAudio())

  // ── Store selectors ─────────────────────────────────────────────────────────
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const queue = usePlayerStore((s) => s.queue)
  const queueIndex = usePlayerStore((s) => s.queueIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const volume = usePlayerStore((s) => s.volume)
  const isMuted = usePlayerStore((s) => s.isMuted)
  const repeat = usePlayerStore((s) => s.repeat)
  const shuffle = usePlayerStore((s) => s.shuffle)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const progress = usePlayerStore((s) => s.progress)
  const isQueueOpen = usePlayerStore((s) => s.isQueueOpen)
  const isFullscreen = usePlayerStore((s) => s.isFullscreen)
  const dominantColor = usePlayerStore((s) => s.dominantColor)

  // ── Store actions ───────────────────────────────────────────────────────────
  const playTrack = usePlayerStore((s) => s.playTrack)
  const pause = usePlayerStore((s) => s.pause)
  const resume = usePlayerStore((s) => s.resume)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const nextTrack = usePlayerStore((s) => s.nextTrack)
  const prevTrack = usePlayerStore((s) => s.prevTrack)
  const toggleMute = usePlayerStore((s) => s.toggleMute)
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat)
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle)
  const toggleQueue = usePlayerStore((s) => s.toggleQueue)
  const toggleFullscreen = usePlayerStore((s) => s.toggleFullscreen)
  const addToQueue = usePlayerStore((s) => s.addToQueue)
  const clearQueue = usePlayerStore((s) => s.clearQueue)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  const setDuration = usePlayerStore((s) => s.setDuration)
  const setPlaying = usePlayerStore((s) => s.setPlaying)
  const setVolume = usePlayerStore((s) => s.setVolume)

  // ── Effect: load new track when currentTrack changes ───────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!currentTrack) {
      audio.pause()
      return
    }
    if (audio.src !== currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl
      audio.load()
    }
    if (isPlaying) {
      audio.play().catch(() => setPlaying(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id])

  // ── Effect: sync play/pause with store ─────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (isPlaying) {
      if (audio.src && audio.paused) {
        audio.play().catch(() => setPlaying(false))
      }
    } else {
      if (!audio.paused) audio.pause()
    }
  }, [isPlaying, setPlaying])

  // ── Effect: sync volume and mute ────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    audio.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume))
  }, [volume, isMuted])

  // ── Effect: wire DOM audio events → store ──────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0)
    }

    const onEnded = () => {
      nextTrack()
    }

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
    // We only want to bind these once — the callbacks close over stable store actions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── seekTo: drives the audio element directly ──────────────────────────────
  const seekTo = useCallback(
    (time: number) => {
      const audio = audioRef.current
      if (!audio.duration) return
      const clamped = Math.max(0, Math.min(time, audio.duration))
      audio.currentTime = clamped
      setCurrentTime(clamped)
    },
    [setCurrentTime],
  )

  return {
    // State
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    volume,
    isMuted,
    repeat,
    shuffle,
    currentTime,
    duration,
    progress,
    isQueueOpen,
    isFullscreen,
    dominantColor,

    // Controls
    playTrack,
    pause,
    resume,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    toggleQueue,
    toggleFullscreen,
    addToQueue,
    clearQueue,

    // Raw ref
    audioRef,
  }
}

export default usePlayer
