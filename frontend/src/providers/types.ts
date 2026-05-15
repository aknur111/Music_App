import type { Track, Album, Artist } from '@/types'

export interface UploadSongPayload {
  title: string
  artist_id: string
  album_id: string
  duration_s: number
  genre: string
  uploader_id: string
}

export interface CreateSongPayload {
  title: string
  artist_id: string
  album_id: string
  duration_s: number
  genre: string
}

export interface UpdateSongPayload {
  title: string
  album_id: string
  duration_s: number
  genre: string
}

export interface CreateAlbumPayload {
  title: string
  artist_id: string
  year: number
}

export interface DeleteSongResponse {
  success: boolean
}

export interface MusicProvider {
  getTracks(params?: { limit?: number; offset?: number }): Promise<Track[]>
  getTrack(id: string): Promise<Track | null>
  searchTracks(query: string): Promise<Track[]>

  getAlbums(params?: { limit?: number }): Promise<Album[]>
  getAlbum(id: string): Promise<Album | null>
  getAlbumTracks(albumId: string): Promise<Track[]>
  createAlbum(payload: CreateAlbumPayload): Promise<Album>

  getArtists(params?: { limit?: number }): Promise<Artist[]>
  getArtist(id: string): Promise<Artist | null>
  searchArtists(query: string): Promise<Artist[]>

  createSong(payload: CreateSongPayload): Promise<Track>
  updateSong(id: string, payload: UpdateSongPayload): Promise<Track>
  deleteSong(id: string): Promise<DeleteSongResponse>

  uploadSong(payload: UploadSongPayload): Promise<Track>
}