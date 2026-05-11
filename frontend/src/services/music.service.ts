import { get } from '@/services/api'
import type { Track, Album, Artist } from '@/types'
import { DEMO_TRACKS, DEMO_ALBUMS, DEMO_ARTISTS } from '@/lib/constants'
import { getProvider } from '@/providers'

async function withFallbacks<T>(
  backendCall: () => Promise<T>,
  providerCall: () => Promise<T>,
  staticFallback: T,
): Promise<T> {
  try {
    return await backendCall()
  } catch {
    try {
      return await providerCall()
    } catch {
      return staticFallback
    }
  }
}

export const MusicService = {
  async getTracks(page = 1, limit = 20): Promise<Track[]> {
    return withFallbacks(
      async () => {
        const data = await get<Track[] | { data: Track[] }>('/api/v1/songs', { page, limit })
        return Array.isArray(data) ? data : data.data
      },
      () => getProvider().getTracks({ limit, offset: (page - 1) * limit }),
      DEMO_TRACKS,
    )
  },

  async getTrack(id: string): Promise<Track> {
    try {
      return await get<Track>(`/api/v1/songs/${id}`)
    } catch {
      try {
        const track = await getProvider().getTrack(id)
        if (track) return track
      } catch {}
      const demo = DEMO_TRACKS.find((t) => t.id === id)
      if (demo) return demo
      throw new Error(`Track "${id}" not found`)
    }
  },

  async searchTracks(query: string): Promise<Track[]> {
    const q = query.trim()
    if (!q) return []
    return withFallbacks(
      async () => {
        const data = await get<Track[] | { data: Track[] }>('/api/v1/songs/search', { q })
        return Array.isArray(data) ? data : data.data
      },
      () => getProvider().searchTracks(q),
      DEMO_TRACKS.filter(
        (t) =>
          t.title.toLowerCase().includes(q.toLowerCase()) ||
          t.artist.toLowerCase().includes(q.toLowerCase()) ||
          t.album.toLowerCase().includes(q.toLowerCase()),
      ),
    )
  },

  async getAlbums(): Promise<Album[]> {
    return withFallbacks(
      async () => {
        const data = await get<Album[] | { data: Album[] }>('/api/v1/albums')
        return Array.isArray(data) ? data : data.data
      },
      () => getProvider().getAlbums(),
      DEMO_ALBUMS,
    )
  },

  async getAlbum(id: string): Promise<Album> {
    try {
      return await get<Album>(`/api/v1/albums/${id}`)
    } catch {
      try {
        const album = await getProvider().getAlbum(id)
        if (album) return album
      } catch {}
      const demo = DEMO_ALBUMS.find((a) => a.id === id)
      if (demo) return demo
      throw new Error(`Album "${id}" not found`)
    }
  },

  async getArtists(): Promise<Artist[]> {
    return withFallbacks(
      async () => {
        const data = await get<Artist[] | { data: Artist[] }>('/api/v1/artists')
        return Array.isArray(data) ? data : data.data
      },
      () => getProvider().getArtists(),
      DEMO_ARTISTS,
    )
  },
}

export default MusicService
