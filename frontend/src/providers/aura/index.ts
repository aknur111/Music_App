import type { MusicProvider } from '@/providers/types'
import { get } from '@/services/api'

function toTrack(song: any) {
  return {
    id: song.id,

    title: song.title,

    artist: song.artist || song.artist_id || '',
    artistId: song.artist_id || '',

    album: song.album_name || song.album_id || 'Unknown Album',
    albumId: song.album_id || '',

    duration: song.duration_s,

    coverUrl: '',
    audioUrl: '',

    genre: song.genre || 'Unknown',

    playCount: 0,
    likeCount: 0,

    createdAt: song.created_at || new Date().toISOString(),
    updatedAt: song.updated_at || new Date().toISOString(),

    spotifyId: song.spotify_id,
    valence: song.valence,
    energy: song.energy,
    danceability: song.danceability,
    tempo: song.tempo,
    acousticness: song.acousticness,
    instrumentalness: song.instrumentalness,
    loudness: song.loudness,
    speechiness: song.speechiness,
  }
}

export const auraProvider: MusicProvider = {
  async getTracks({ limit = 20, offset = 0 } = {}) {
    const page = Math.floor(offset / limit) + 1

    const res = await get<{
      songs: any[]
      total: number
    }>(
      '/api/v1/music/songs',
      { page, limit },
    )

    return res.songs.map(toTrack)
  },

  async getTrack(id) {
    const song = await get<any>(
      `/api/v1/music/songs/${id}`,
    )

    return song ? toTrack(song) : null
  },

  async getAlbums() {
    return []
  },

  async getAlbum() {
    return null
  },

  async getArtists() {
    return []
  },

  async getArtist() {
    return null
  },

  async searchTracks(query) {
    const res = await get<{
      songs: any[]
    }>(
      '/api/v1/music/songs/search',
      { q: query },
    )

    return res.songs.map(toTrack)
  },
}