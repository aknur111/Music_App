import { create } from 'zustand'
import type { Track } from '@/types'

interface FavoritesState {
  tracks: Track[]
  isLiked: (id: string) => boolean
  toggle: (track: Track) => void
}

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  tracks: [],
  isLiked: (id) => get().tracks.some((t) => t.id === id),
  toggle: (track) =>
    set((s) => ({
      tracks: s.tracks.some((t) => t.id === track.id)
        ? s.tracks.filter((t) => t.id !== track.id)
        : [...s.tracks, track],
    })),
}))
