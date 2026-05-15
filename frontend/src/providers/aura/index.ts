import type { MusicProvider } from '@/providers/types'
import type { Album, Artist, Track } from '@/types'
import { get, post, put, del } from '@/services/api'

// Deterministic gradient cover — no network calls, always instant.
function hashNum(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function gradientCover(label: string): string {
  const n = hashNum(label)
  const h1 = n % 360
  const h2 = (h1 + 50) % 360
  const h3 = (h1 + 25) % 360
  const letter = (label[0] || '♪').toUpperCase()
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">` +
    `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">` +
    `<stop offset="0%" stop-color="hsl(${h1},65%,45%)"/>` +
    `<stop offset="50%" stop-color="hsl(${h3},60%,32%)"/>` +
    `<stop offset="100%" stop-color="hsl(${h2},70%,22%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="600" height="600" fill="url(#g)"/>` +
    `<circle cx="300" cy="300" r="200" fill="white" fill-opacity="0.06"/>` +
    `<text x="300" y="340" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="system-ui,sans-serif" font-size="240" fill="white" fill-opacity="0.25">${letter}</text>` +
    `</svg>`
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

function parseCreatedAt(raw: any): string {
  if (!raw) return new Date().toISOString()
  // protobuf Timestamp arrives as {seconds, nanos}
  if (typeof raw === 'object' && raw.seconds != null) {
    return new Date(raw.seconds * 1000).toISOString()
  }
  // unix int (artists)
  if (typeof raw === 'number') return new Date(raw * 1000).toISOString()
  return String(raw)
}

function toTrack(song: any): Track {
  const artist = song.artist || song.artist_name || song.artist_id || ''
  const title  = song.title || ''
  return {
    id:        song.id,
    title,
    artist,
    artistId:  song.artist_id || '',
    album:     song.album || song.album_name || song.album_id || 'Unknown Album',
    albumId:   song.album_id || '',
    duration:  song.duration_s,
    coverUrl:  song.cover_url || song.image || gradientCover(artist || title),
    audioUrl:  song.preview_url || song.audio_url || '',
    genre:     song.genre || 'Unknown',
    playCount: 0,
    likeCount: 0,
    createdAt: parseCreatedAt(song.created_at),
    updatedAt: parseCreatedAt(song.updated_at),
    spotifyId:        song.spotify_id,
    valence:          song.valence,
    energy:           song.energy,
    danceability:     song.danceability,
    tempo:            song.tempo,
    acousticness:     song.acousticness,
    instrumentalness: song.instrumentalness,
    loudness:         song.loudness,
    speechiness:      song.speechiness,
  }
}

function toAlbum(a: any): Album {
  const artist = a.artist || a.artist_name || ''
  const title  = a.title || a.name || 'Unknown Album'
  return {
    id:          a.id,
    title,
    artistId:    a.artist_id || '',
    artist,
    coverUrl:    a.cover_url || a.image || gradientCover(artist || title),
    releaseYear: a.year || a.release_year || 0,
    genre:       a.genre || '',
    trackCount:  a.songs?.length ?? a.track_count ?? 0,
    tracks:      a.songs ? a.songs.map(toTrack) : undefined,
    createdAt:   parseCreatedAt(a.created_at),
  }
}

function toArtist(a: any): Artist {
  const name      = a.name || ''
  const avatarUrl = a.avatar_url || a.image || gradientCover(name)
  return {
    id:            a.id,
    name,
    bio:           a.bio || '',
    avatarUrl,
    coverUrl:      a.cover_url || avatarUrl,
    genre:         a.genre || '',
    followerCount: a.follower_count ?? 0,
    albumCount:    a.album_count    ?? 0,
    trackCount:    a.track_count    ?? 0,
    isFollowed:    false,
    createdAt:     parseCreatedAt(a.created_at),
  }
}

export const auraProvider: MusicProvider = {
  async getTracks({ limit = 20, offset = 0 } = {}) {
    const page = Math.floor(offset / limit) + 1
    const res = await get<any>('/api/v1/music/songs', { page, limit })
    return (res.songs ?? []).map(toTrack)
  },

  async getTrack(id) {
    const song = await get<any>(`/api/v1/music/songs/${id}`)
    return song ? toTrack(song) : null
  },

  async searchTracks(query) {
    const res = await get<any>('/api/v1/music/songs/search', { q: query })
    return (res.songs ?? []).map(toTrack)
  },

  async getAlbums({ limit = 50 } = {}) {
    try {
      const res = await get<any>('/api/v1/music/albums', { limit })
      return (res.albums ?? []).map(toAlbum)
    } catch {
      return []
    }
  },

  async getAlbum(id) {
    try {
      const album = await get<any>(`/api/v1/music/albums/${id}`)
      return album ? toAlbum(album) : null
    } catch {
      return null
    }
  },

  async getAlbumTracks(albumId) {
    const res = await get<any>('/api/v1/music/songs', { album_id: albumId, limit: 100 })
    return (res.songs ?? []).map(toTrack)
  },

  async getArtists({ limit = 50 } = {}) {
    try {
      const res = await get<any>('/api/v1/music/artists', { limit })
      return (res.artists ?? []).map(toArtist)
    } catch {
      return []
    }
  },

  async getArtist(id) {
    try {
      const artist = await get<any>(`/api/v1/music/artists/${id}`)
      return artist ? toArtist(artist) : null
    } catch {
      return null
    }
  },

  async searchArtists(query) {
    const res = await get<any>('/api/v1/music/artists/search', { q: query })
    return (res.artists ?? []).map(toArtist)
  },

  async uploadSong(payload) {
    const song = await post<any>('/api/v1/music/upload', payload)
    return toTrack(song)
  },

  async createSong(payload) {
    const song = await post<any>('/api/v1/music/songs', payload)
    return toTrack(song)
  },

  async updateSong(id, payload) {
    const song = await put<any>(`/api/v1/music/songs/${id}`, payload)
    return toTrack(song)
  },

  async deleteSong(id) {
    return await del<{ success: boolean }>(`/api/v1/music/songs/${id}`)
  },

  async createAlbum(payload) {
    const album = await post<any>('/api/v1/music/albums', payload)
    return toAlbum(album)
  },
}
