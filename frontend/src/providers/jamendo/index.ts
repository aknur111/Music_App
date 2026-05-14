import type { MusicProvider } from '@/providers/types'
import * as client from './client'
import { toTrack, toAlbum, toArtist } from './mapper'

export const jamendoProvider: MusicProvider = {
  async getTracks({ limit = 20, offset = 0 } = {}) {
    const raw = await client.fetchTracks({ limit, offset })
    return raw.map(toTrack)
  },

  async getTrack(id) {
    const rawId = id.replace(/^jmd-t-/, '')
    const raw = await client.fetchTrack(rawId)
    return raw ? toTrack(raw) : null
  },

  async getAlbums({ limit = 20 } = {}) {
    const raw = await client.fetchAlbums({ limit })
    return raw.map((a) => toAlbum(a))
  },

  async getAlbum(id) {
    const rawId = id.replace(/^jmd-al-/, '')
    const [raw, tracks] = await Promise.all([
      client.fetchAlbum(rawId),
      client.fetchAlbumTracks(rawId),
    ])

    if (!raw) return null

    const album = toAlbum(raw, tracks.length)
    album.tracks = tracks.map(toTrack)

    return album
  },

  async getAlbumTracks(id) {
    const rawId = id.replace(/^jmd-al-/, '')
    const raw = await client.fetchAlbumTracks(rawId)
    return raw.map(toTrack)
  },

  async getArtists({ limit = 20 } = {}) {
    const raw = await client.fetchArtists({ limit })
    return raw.map(toArtist)
  },

  async getArtist(id) {
    const rawId = id.replace(/^jmd-a-/, '')
    const raw = await client.fetchArtist(rawId)
    return raw ? toArtist(raw) : null
  },

  async searchTracks(query) {
    const raw = await client.fetchTracks({ search: query, limit: 20 })
    return raw.map(toTrack)
  },

  async searchArtists(_query: string) {
    return []
  },

  async uploadSong() {
    throw new Error('UploadSong is not supported by Jamendo provider')
  },

  async createSong() {
    throw new Error('CreateSong is not supported by Jamendo provider')
  },

  async updateSong() {
    throw new Error('UpdateSong is not supported by Jamendo provider')
  },

  async deleteSong() {
    throw new Error('DeleteSong is not supported by Jamendo provider')
  },

  async createAlbum() {
    throw new Error('CreateAlbum is not supported by Jamendo provider')
  },
}