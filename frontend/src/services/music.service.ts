import type { Track, Album, Artist } from '@/types'
import type {
  UploadSongPayload,
  CreateSongPayload,
  UpdateSongPayload,
  CreateAlbumPayload,
  DeleteSongResponse,
} from '@/providers/types'
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

  async createSong(payload: CreateSongPayload): Promise<Track> {
    return await getProvider().createSong(payload)
  },

  async updateSong(
    id: string,
    payload: UpdateSongPayload,
  ): Promise<Track> {
    return await getProvider().updateSong(id, payload)
  },

  async deleteSong(id: string): Promise<DeleteSongResponse> {
    return await getProvider().deleteSong(id)
  },

  async uploadSong(payload: UploadSongPayload): Promise<Track> {
    return await getProvider().uploadSong(payload)
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

  async getAlbumTracks(albumId: string): Promise<Track[]> {
    try {
      return await getProvider().getAlbumTracks(albumId)
    } catch {
      return DEMO_TRACKS.filter((track) => track.albumId === albumId)
    }
  },

  async createAlbum(payload: CreateAlbumPayload): Promise<Album> {
    return await getProvider().createAlbum(payload)
  },

  async getArtists(): Promise<Artist[]> {
    try {
      return await getProvider().getArtists()
    } catch {
      return DEMO_ARTISTS
    }
  },

  async getArtist(id: string): Promise<Artist> {
    try {
      const artist = await getProvider().getArtist(id)
      if (artist) return artist
    } catch {}

    const demo = DEMO_ARTISTS.find((a) => a.id === id)
    if (demo) return demo

    throw new Error(`Artist "${id}" not found`)
  },

  async searchArtists(query: string): Promise<Artist[]> {
    const q = query.trim()
    if (!q) return []

    try {
      return await getProvider().searchArtists(q)
    } catch {
      const lower = q.toLowerCase()

      return DEMO_ARTISTS.filter((artist) =>
        artist.name.toLowerCase().includes(lower),
      )
    }
  },
}

export default MusicService