import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Track } from '@/types'

interface FavoritesState {
  tracks: Track[]
  isLiked: (id: string) => boolean
  toggle: (track: Track) => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      tracks: [],
      isLiked: (id) => get().tracks.some((t) => t.id === id),
      toggle: (track) =>
        set((s) => ({
          tracks: s.tracks.some((t) => t.id === track.id)
            ? s.tracks.filter((t) => t.id !== track.id)
            : [...s.tracks, track],
        })),
    }),
    { name: 'aura-favorites' },
  ),
)
