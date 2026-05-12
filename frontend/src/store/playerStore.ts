import { create } from 'zustand'
import type { Track } from '@/types'
import { getAudio } from '@/lib/audioEngine'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RepeatMode = 'none' | 'one' | 'all'

// ─── State interface ──────────────────────────────────────────────────────────

interface PlayerState {
  // Playback
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean

  // Audio controls
  volume: number       // 0–1
  isMuted: boolean
  repeat: RepeatMode
  shuffle: boolean
  currentTime: number  // seconds (absolute, not ratio)
  duration: number     // seconds

  // UI
  isQueueOpen: boolean
  isFullscreen: boolean
  dominantColor: string

  // ── Legacy / internal helpers (kept for backwards-compat) ─────────────────
  progress: number     // 0–1 ratio (derived from currentTime / duration)
  isShuffle: boolean   // alias for shuffle
  repeatMode: RepeatMode // alias for repeat

  // ── Required actions ──────────────────────────────────────────────────────
  playTrack: (track: Track, queue?: Track[]) => void
  pause: () => void
  resume: () => void
  nextTrack: () => void
  prevTrack: () => void
  seekTo: (time: number) => void   // absolute seconds
  setVolume: (v: number) => void
  toggleMute: () => void
  toggleRepeat: () => void
  toggleShuffle: () => void
  toggleQueue: () => void
  toggleFullscreen: () => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  addToQueue: (track: Track) => void
  clearQueue: () => void

  // ── Legacy helpers (used by existing usePlayer hook) ──────────────────────
  setCurrentTrack: (track: Track | null) => void
  setQueue: (tracks: Track[], startIndex?: number) => void
  removeFromQueue: (index: number) => void
  playNext: () => void
  playPrev: () => void
  setPlaying: (playing: boolean) => void
  togglePlay: () => void
  setShuffle: (shuffle: boolean) => void
  setRepeatMode: (mode: RepeatMode) => void
  cycleRepeat: () => void
  setProgress: (progress: number) => void
  setFullscreen: (open: boolean) => void
  setDominantColor: (color: string) => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  volume: 0.8,
  isMuted: false,
  repeat: 'none',
  shuffle: false,
  currentTime: 0,
  duration: 0,
  isQueueOpen: false,
  isFullscreen: false,
  dominantColor: '#7c3aed',

  // Derived / aliased fields kept in sync manually
  progress: 0,
  isShuffle: false,
  repeatMode: 'none',

  // ── playTrack ──────────────────────────────────────────────────────────────
  playTrack: (track: Track, queue?: Track[]) => {
    const newQueue = queue ?? get().queue
    const idx = newQueue.findIndex((t) => t.id === track.id)
    const resolvedIndex = idx >= 0 ? idx : 0
    const resolvedQueue = idx >= 0 ? newQueue : [track, ...newQueue]
    set({
      currentTrack: track,
      queue: resolvedQueue,
      queueIndex: resolvedIndex,
      isPlaying: true,
      currentTime: 0,
      progress: 0,
    })
  },

  // ── pause / resume ─────────────────────────────────────────────────────────
  pause: () => set({ isPlaying: false }),
  resume: () => {
    if (get().currentTrack) set({ isPlaying: true })
  },

  // ── nextTrack ──────────────────────────────────────────────────────────────
  nextTrack: () => {
    const { queue, queueIndex, shuffle, repeat } = get()
    if (!queue.length) return

    let nextIndex: number
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else if (repeat === 'one') {
      nextIndex = queueIndex
    } else if (queueIndex < queue.length - 1) {
      nextIndex = queueIndex + 1
    } else if (repeat === 'all') {
      nextIndex = 0
    } else {
      set({ isPlaying: false })
      return
    }

    set({
      queueIndex: nextIndex,
      currentTrack: queue[nextIndex],
      currentTime: 0,
      progress: 0,
      isPlaying: true,
    })
  },

  // ── prevTrack ──────────────────────────────────────────────────────────────
  prevTrack: () => {
    const { queue, queueIndex, currentTime } = get()
    if (!queue.length) return
    // Restart current track if more than 3 s in
    if (currentTime > 3) {
      getAudio().currentTime = 0
      set({ currentTime: 0, progress: 0 })
      return
    }
    const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1
    set({
      queueIndex: prevIndex,
      currentTrack: queue[prevIndex],
      currentTime: 0,
      progress: 0,
      isPlaying: true,
    })
  },

  // ── seekTo ─────────────────────────────────────────────────────────────────
  seekTo: (time: number) => {
    const { duration } = get()
    const clamped = Math.max(0, Math.min(time, duration))
    const audio = getAudio()
    if (audio.duration) audio.currentTime = clamped
    set({ currentTime: clamped, progress: duration > 0 ? clamped / duration : 0 })
  },

  // ── volume / mute ──────────────────────────────────────────────────────────
  setVolume: (v: number) => set({ volume: Math.max(0, Math.min(1, v)), isMuted: false }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  // ── repeat / shuffle ───────────────────────────────────────────────────────
  toggleRepeat: () =>
    set((s) => {
      const next: RepeatMode =
        s.repeat === 'none' ? 'all' : s.repeat === 'all' ? 'one' : 'none'
      return { repeat: next, repeatMode: next }
    }),
  toggleShuffle: () =>
    set((s) => ({ shuffle: !s.shuffle, isShuffle: !s.isShuffle })),

  // ── UI toggles ─────────────────────────────────────────────────────────────
  toggleQueue: () => set((s) => ({ isQueueOpen: !s.isQueueOpen })),
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),

  // ── time / duration setters ────────────────────────────────────────────────
  setCurrentTime: (t: number) => {
    const { duration } = get()
    set({ currentTime: t, progress: duration > 0 ? t / duration : 0 })
  },
  setDuration: (d: number) => set({ duration: d }),

  // ── queue management ───────────────────────────────────────────────────────
  addToQueue: (track: Track) => set((s) => ({ queue: [...s.queue, track] })),
  clearQueue: () => set({ queue: [], queueIndex: 0 }),

  // ── Legacy aliases (used by existing code / usePlayer hook) ───────────────
  setCurrentTrack: (track: Track | null) => set({ currentTrack: track, currentTime: 0, progress: 0 }),

  setQueue: (tracks: Track[], startIndex = 0) =>
    set({
      queue: tracks,
      queueIndex: startIndex,
      currentTrack: tracks[startIndex] ?? null,
    }),

  removeFromQueue: (index: number) =>
    set((s) => {
      const queue = s.queue.filter((_, i) => i !== index)
      const queueIndex = index < s.queueIndex ? s.queueIndex - 1 : s.queueIndex
      return { queue, queueIndex }
    }),

  playNext: () => get().nextTrack(),
  playPrev: () => get().prevTrack(),

  setPlaying: (playing: boolean) => set({ isPlaying: playing }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  setShuffle: (shuffle: boolean) => set({ shuffle, isShuffle: shuffle }),

  setRepeatMode: (mode: RepeatMode) => set({ repeatMode: mode, repeat: mode }),

  cycleRepeat: () =>
    set((s) => {
      const next: RepeatMode =
        s.repeat === 'none' ? 'all' : s.repeat === 'all' ? 'one' : 'none'
      return { repeat: next, repeatMode: next }
    }),

  setProgress: (progress: number) => {
    const { duration } = get()
    set({ progress, currentTime: duration * progress })
  },

  setFullscreen: (open: boolean) => set({ isFullscreen: open }),
  setDominantColor: (color: string) => set({ dominantColor: color }),
}))

export default usePlayerStore
