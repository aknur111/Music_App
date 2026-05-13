import { get, post } from '@/services/api'
import { fetchTracks } from '@/providers/jamendo/client'
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

async function toTrack(raw: RecommendTrackRaw): Promise<Track> {
  const track: Track = {
    id: raw.id,
    title: raw.name,
    artist: raw.artists,
    artistId: '',
    album: raw.album,
    albumId: '',
    duration: Math.round(raw.duration_ms / 1000),
    coverUrl: '',
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

  try {
    const firstArtist = raw.artists.split(',')[0].trim()
    const hits = await fetchTracks({ search: `${firstArtist} ${raw.name}`, limit: 1 })
    if (hits.length > 0) {
      track.coverUrl = hits[0].image
      // Use Jamendo audio only as fallback when backend has no iTunes preview URL
      if (!track.audioUrl) {
        track.audioUrl = hits[0].audio
      }
    }
  } catch {
    // enrichment is best-effort; track usable with placeholder cover
  }

  return track
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
