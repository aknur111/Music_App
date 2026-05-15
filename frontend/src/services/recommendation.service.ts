import { get, post } from '@/services/api'
import type { Track } from '@/types'
import type { MoodMeta } from '@/types/recommendation'

// Raw shape returned by the gateway recommendation endpoints (proto3 JSON)
interface RecommendTrackRaw {
  id: string
  spotify_id: string
  name: string
  artists: string
  album: string
  genre: string
  duration_ms: number
  popularity: number
  valence: number
  energy: number
  danceability: number
  tempo: number
  acousticness: number
  instrumentalness: number
  loudness: number
  speechiness: number
  preview_url?: string
}

// iTunes Search API — free, no API key, CORS-friendly, has all mainstream artists.
// Returns high-res artwork (600×600) for the best-matching song.
async function fetchItunesArtwork(artist: string, name: string): Promise<string> {
  try {
    const term = encodeURIComponent(`${artist} ${name}`)
    const res = await fetch(
      `https://itunes.apple.com/search?term=${term}&entity=song&limit=1&media=music`,
      { signal: AbortSignal.timeout(5000) },
    )
    if (!res.ok) return ''
    const data = await res.json()
    const artwork: string | undefined = data.results?.[0]?.artworkUrl100
    return artwork ? artwork.replace('100x100bb', '600x600bb') : ''
  } catch {
    return ''
  }
}

async function toTrack(raw: RecommendTrackRaw): Promise<Track> {
  const firstArtist = raw.artists.split(',')[0].trim()

  const [coverUrl] = await Promise.all([
    fetchItunesArtwork(firstArtist, raw.name),
  ])

  return {
    id: raw.id,
    title: raw.name,
    artist: raw.artists,
    artistId: '',
    album: raw.album,
    albumId: '',
    duration: Math.round(raw.duration_ms / 1000),
    coverUrl,
    // Only use the iTunes preview stored in the DB — never fall back to a
    // random Jamendo track (Jamendo has no mainstream artists, wrong song plays).
    audioUrl: raw.preview_url ?? '',
    genre: raw.genre,
    playCount: raw.popularity,
    likeCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    spotifyId: raw.spotify_id,
    valence: raw.valence,
    energy: raw.energy,
    danceability: raw.danceability,
    tempo: raw.tempo,
    acousticness: raw.acousticness,
    instrumentalness: raw.instrumentalness,
    loudness: raw.loudness,
    speechiness: raw.speechiness,
  }
}

async function enrichAll(raws: RecommendTrackRaw[]): Promise<Track[]> {
  const settled = await Promise.allSettled(raws.map(toTrack))
  return settled
    .filter((r): r is PromiseFulfilledResult<Track> => r.status === 'fulfilled')
    .map((r) => r.value)
}

export const RecommendationService = {
  async listMoods(): Promise<MoodMeta[]> {
    const data = await get<{ moods: MoodMeta[] }>('/api/v1/recommendations/moods')
    return data.moods
  },

  async getRecommendationsByMood(mood: string, limit = 20): Promise<Track[]> {
    const data = await get<{ tracks: RecommendTrackRaw[] }>(
      `/api/v1/recommendations/moods/${mood}`,
      { limit },
    )
    return enrichAll(data.tracks ?? [])
  },

  async getMoodRadio(mood: string): Promise<Track[]> {
    const data = await get<{ tracks: RecommendTrackRaw[] }>(
      `/api/v1/recommendations/moods/${mood}/radio`,
    )
    return enrichAll(data.tracks ?? [])
  },

  async getSimilarTracks(trackId: string, limit = 10): Promise<Track[]> {
    const data = await get<{ tracks: RecommendTrackRaw[] }>(
      `/api/v1/recommendations/similar/${trackId}`,
      { limit },
    )
    return enrichAll(data.tracks ?? [])
  },

  async getPersonalRecommendations(limit = 20): Promise<Track[]> {
    const data = await get<{ tracks: RecommendTrackRaw[] }>(
      '/api/v1/recommendations/personal',
      { limit },
    )
    return enrichAll(data.tracks ?? [])
  },

  async recordPlayback(trackId: string): Promise<void> {
    await post<{ status: string }>('/api/v1/recommendations/playback', { track_id: trackId })
  },

  async getTrendingTracks(limit = 20): Promise<Track[]> {
    const data = await get<{ tracks: RecommendTrackRaw[] }>(
      '/api/v1/recommendations/trending',
      { limit },
    )
    return enrichAll(data.tracks ?? [])
  },

  async rateTrack(trackId: string, rating: number): Promise<void> {
    await post<{ status: string }>('/api/v1/recommendations/rate', {
      track_id: trackId,
      rating,
    })
  },

  async getMyWave(moodBias = '', limit = 30, excludeIds: string[] = []): Promise<Track[]> {
    const params: Record<string, unknown> = { limit }
    if (moodBias) params.mood = moodBias
    if (excludeIds.length > 0) params.exclude = excludeIds.join(',')
    const data = await get<{ tracks: RecommendTrackRaw[] }>(
      '/api/v1/recommendations/wave',
      params,
    )
    return enrichAll(data.tracks ?? [])
  },
}

export default RecommendationService
