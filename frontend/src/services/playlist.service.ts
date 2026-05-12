import type { Playlist, PlaylistCreateInput, PlaylistUpdateInput } from '@/types'
import { MOCK_PLAYLISTS } from '@/lib/mockData'

let _playlists: Playlist[] = MOCK_PLAYLISTS.map((p) => ({ ...p }))

export const PlaylistService = {
  async getUserPlaylists(): Promise<Playlist[]> {
    return _playlists
  },

  async getPlaylist(id: string): Promise<Playlist> {
    const playlist = _playlists.find((p) => p.id === id)
    if (playlist) return playlist
    throw new Error(`Playlist "${id}" not found`)
  },

  async createPlaylist(input: PlaylistCreateInput): Promise<Playlist> {
    const now = new Date().toISOString()
    const playlist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: input.name,
      description: input.description ?? '',
      coverUrl: input.coverUrl ?? '',
      trackIds: [],
      tracks: [],
      ownerId: 'local-user',
      isPublic: input.isPublic ?? false,
      followerCount: 0,
      createdAt: now,
      updatedAt: now,
    }
    _playlists = [..._playlists, playlist]
    return playlist
  },

  async addTrack(playlistId: string, trackId: string): Promise<void> {
    _playlists = _playlists.map((p) =>
      p.id === playlistId && !p.trackIds.includes(trackId)
        ? { ...p, trackIds: [...p.trackIds, trackId] }
        : p,
    )
  },

  async removeTrack(playlistId: string, trackId: string): Promise<void> {
    _playlists = _playlists.map((p) =>
      p.id === playlistId
        ? {
            ...p,
            trackIds: p.trackIds.filter((id) => id !== trackId),
            tracks: (p.tracks ?? []).filter((t) => t.id !== trackId),
          }
        : p,
    )
  },

  async updatePlaylist(id: string, updates: PlaylistUpdateInput): Promise<Playlist> {
    const playlist = _playlists.find((p) => p.id === id)
    if (!playlist) throw new Error(`Playlist "${id}" not found`)
    const updated = { ...playlist, ...updates, updatedAt: new Date().toISOString() }
    _playlists = _playlists.map((p) => (p.id === id ? updated : p))
    return updated
  },

  async deletePlaylist(id: string): Promise<void> {
    _playlists = _playlists.filter((p) => p.id !== id)
  },
}

export default PlaylistService
