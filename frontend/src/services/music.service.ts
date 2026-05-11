import type { Track, Album, Artist } from '@/types'
import { DEMO_TRACKS, DEMO_ALBUMS, DEMO_ARTISTS } from '@/lib/constants'
import { getProvider } from '@/providers'

export const MusicService = {
  async getTracks(page = 1, limit = 20): Promise<Track[]> {
    try {
      return await getProvider().getTracks({ limit, offset: (page - 1) * limit })
    } catch {
      return DEMO_TRACKS
    }
  },

  async getTrack(id: string): Promise<Track> {
    try {
      const track = await getProvider().getTrack(id)
      if (track) return track
    } catch {}
    const demo = DEMO_TRACKS.find((t) => t.id === id)
    if (demo) return demo
    throw new Error(`Track "${id}" not found`)
  },

  async searchTracks(query: string): Promise<Track[]> {
    const q = query.trim()
    if (!q) return []
    try {
      return await getProvider().searchTracks(q)
    } catch {
      const lower = q.toLowerCase()
      return DEMO_TRACKS.filter(
        (t) =>
          t.title.toLowerCase().includes(lower) ||
          t.artist.toLowerCase().includes(lower) ||
          t.album.toLowerCase().includes(lower),
      )
    }
  },

  async getAlbums(): Promise<Album[]> {
    try {
      return await getProvider().getAlbums()
    } catch {
      return DEMO_ALBUMS
    }
  },

  async getAlbum(id: string): Promise<Album> {
    try {
      const album = await getProvider().getAlbum(id)
      if (album) return album
    } catch {}
    const demo = DEMO_ALBUMS.find((a) => a.id === id)
    if (demo) return demo
    throw new Error(`Album "${id}" not found`)
  },

  async getArtists(): Promise<Artist[]> {
    try {
      return await getProvider().getArtists()
    } catch {
      return DEMO_ARTISTS
    }
  },
}

export default MusicService
