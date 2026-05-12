import type { Playlist, PlaylistCreateInput } from '@/types'
import axiosInstance from '@/services/api'

interface ApiPlaylist {
  id: string
  user_id: string
  name: string
  description: string
  created_at: number
  updated_at: number
}

function toPlaylist(p: ApiPlaylist): Playlist {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    coverUrl: '',
    trackIds: [],
    tracks: [],
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

  async addTrack(playlistId: string, trackId: string): Promise<void> {
    await axiosInstance.post(`/api/v1/playlists/${playlistId}/songs`, { song_id: trackId })
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
