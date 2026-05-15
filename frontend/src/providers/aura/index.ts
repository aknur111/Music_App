import type { MusicProvider } from '@/providers/types'
import { get, post, put, del } from '@/services/api'

function toTrack(song: any) {
  return {
    id: song.id,

    title: song.title,
    artist: song.artist || song.artist_name || song.artist_id || '',
    artistId: song.artist_id || '',

    album:
      song.album ||
      song.album_name ||
      song.album_id ||
      'Unknown Album',
      
    albumId: song.album_id || '',

    duration: song.duration_s,

    coverUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300',

    audioUrl: '',

    genre: song.genre || 'Unknown',

    playCount: 0,
    likeCount: 0,

    createdAt:
      song.created_at ||
      new Date().toISOString(),

    updatedAt:
      song.updated_at ||
      new Date().toISOString(),
  }
}

function toArtist(artist: any) {
  return {
    id: artist.id,

    name: artist.name,

    bio: artist.bio || '',

    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',

    coverUrl: '',

    genre: 'Unknown',

    followerCount: 0,
    albumCount: 0,
    trackCount: 0,

    createdAt:
      artist.created_at ||
      new Date().toISOString(),
  }
}

function toAlbum(album: any) {
  return {
    id: album.id,

    title: album.title,

    artistId: album.artist_id,

    artist:
      album.artist ||
      album.artist_name ||
      'Unknown Artist',

    coverUrl:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300',

    releaseYear:
      album.year || 2024,

    genre: 'Unknown',

    trackCount:
      album.songs?.length || 0,

    tracks:
      album.songs?.map(toTrack) || [],

    createdAt:
      new Date().toISOString(),
  }
}

export const auraProvider: MusicProvider = {
  async getTracks(
    { limit = 20, offset = 0 } = {},
  ) {
    const page =
      Math.floor(offset / limit) + 1

    const res = await get<any>(
      '/api/v1/music/songs',
      { page, limit },
    )

    return res.songs.map(toTrack)
  },

  async getTrack(id) {
    const song = await get<any>(
      `/api/v1/music/songs/${id}`,
    )

    return song
      ? toTrack(song)
      : null
  },

  async searchTracks(query) {
    const res = await get<any>(
      '/api/v1/music/songs/search',
      { q: query },
    )

    return res.songs.map(toTrack)
  },

  async getAlbums(
    { limit = 50 } = {},
  ) {
    const res = await get<any>(
      '/api/v1/music/albums',
      { limit },
    )

    return res.albums.map(toAlbum)
  },

  async getAlbum(id) {
    const album = await get<any>(
      `/api/v1/music/albums/${id}`,
    )

    return album
      ? toAlbum(album)
      : null
  },

    async getAlbumTracks(albumId) {
    const res = await get<any>(
      '/api/v1/music/songs',
      {
        album_id: albumId,
        limit: 100,
      },
    )

    return res.songs.map(toTrack)
  },

  async getArtists(
    { limit = 50 } = {},
  ) {
    const res = await get<any>(
      '/api/v1/music/artists',
      { limit },
    )

    return res.artists.map(toArtist)
  },

  async getArtist(id) {
    const artist = await get<any>(
      `/api/v1/music/artists/${id}`,
    )

    return artist
      ? toArtist(artist)
      : null
  },

  async searchArtists(query) {
    const res = await get<any>(
      '/api/v1/music/artists/search',
      { q: query },
    )

    return res.artists.map(toArtist)
  },

  async uploadSong(payload) {
    const song = await post<any>(
      '/api/v1/music/upload',
      payload,
    )

    return toTrack(song)
  },

  async createSong(payload) {
    const song = await post<any>(
      '/api/v1/music/songs',
      payload,
    )

    return toTrack(song)
  },

  async updateSong(id, payload) {
    const song = await put<any>(
      `/api/v1/music/songs/${id}`,
      payload,
    )

    return toTrack(song)
  },

  async deleteSong(id) {
    return await del<{ success: boolean }>(
      `/api/v1/music/songs/${id}`,
    )
  },

  async createAlbum(payload) {
    const album = await post<any>(
      '/api/v1/music/albums',
      payload,
    )

    return toAlbum(album)
  },
}