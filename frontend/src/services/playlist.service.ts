import type { Playlist, PlaylistCreateInput, Track } from '@/types'
import axiosInstance from '@/services/api'

interface ApiSong {
  song_id: string
  title: string
  artist: string
  cover_url: string
  audio_url: string
  duration_s: number
  position: number
}

interface ApiPlaylist {
  id: string
  user_id: string
  name: string
  description: string
  song_count: number
  songs?: ApiSong[]
  created_at: number
  updated_at: number
}

function apiSongToTrack(s: ApiSong): Track {
  return {
    id: s.song_id,
    title: s.title,
    artist: s.artist,
    artistId: '',
    album: '',
    albumId: '',
    duration: s.duration_s,
    coverUrl: s.cover_url,
    audioUrl: s.audio_url,
    genre: '',
    playCount: 0,
    likeCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function toPlaylist(p: ApiPlaylist): Playlist {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    coverUrl: (p.songs ?? []).find((s) => s.cover_url)?.cover_url ?? '',
    trackIds: (p.songs ?? []).map((s) => s.song_id),
    tracks: (p.songs ?? []).map(apiSongToTrack),
    ownerId: p.user_id,
    isPublic: false,
    followerCount: 0,
    createdAt: new Date(p.created_at * 1000).toISOString(),
    updatedAt: new Date(p.updated_at * 1000).toISOString(),
  }
}

export const PlaylistService = {
  async getUserPlaylists(): Promise<Playlist[]> {
    try {
      const { data } = await axiosInstance.get<{ playlists: ApiPlaylist[]; total: number }>(
        '/api/v1/playlists',
        { params: { limit: 50 } }
      )
      return (data.playlists ?? []).map(toPlaylist)
    } catch {
      return []
    }
  },

  async getPlaylist(id: string): Promise<Playlist> {
    const { data } = await axiosInstance.get<ApiPlaylist>(`/api/v1/playlists/${id}`)
    return toPlaylist(data)
  },

  async createPlaylist(input: PlaylistCreateInput): Promise<Playlist> {
    const { data } = await axiosInstance.post<ApiPlaylist>('/api/v1/playlists', {
      name: input.name,
      description: input.description ?? '',
    })
    return toPlaylist(data)
  },

  async addTrack(playlistId: string, track: Track | string): Promise<void> {
    if (typeof track === 'string') {
      await axiosInstance.post(`/api/v1/playlists/${playlistId}/songs`, { song_id: track })
    } else {
      await axiosInstance.post(`/api/v1/playlists/${playlistId}/songs`, {
        song_id: track.id,
        title: track.title,
        artist: typeof track.artist === 'string' ? track.artist : (track.artist as { name?: string })?.name ?? '',
        cover_url: track.coverUrl ?? '',
        audio_url: track.audioUrl ?? '',
        duration_s: track.duration ?? 0,
      })
    }
  },

  async removeTrack(playlistId: string, trackId: string): Promise<void> {
    await axiosInstance.delete(`/api/v1/playlists/${playlistId}/songs/${trackId}`)
  },

  async updatePlaylist(id: string, name: string, description: string): Promise<Playlist> {
    const { data } = await axiosInstance.put<ApiPlaylist>(`/api/v1/playlists/${id}`, {
      name,
      description,
    })
    return toPlaylist(data)
  },

  async deletePlaylist(id: string): Promise<void> {
    await axiosInstance.delete(`/api/v1/playlists/${id}`)
  },
}

export default PlaylistService
