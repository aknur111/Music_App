import type { Track, Album, Artist } from '@/types'

export interface MusicProvider {
  getTracks(params?: { limit?: number; offset?: number }): Promise<Track[]>
  getTrack(id: string): Promise<Track | null>
  getAlbums(params?: { limit?: number }): Promise<Album[]>
  getAlbum(id: string): Promise<Album | null>
  getArtists(params?: { limit?: number }): Promise<Artist[]>
  getArtist(id: string): Promise<Artist | null>
  searchTracks(query: string): Promise<Track[]>
}
