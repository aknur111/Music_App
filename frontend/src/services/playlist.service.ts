import { get, post, del } from '@/services/api';
import api from '@/services/api';
import type { Playlist, PlaylistCreateInput, PlaylistUpdateInput } from '@/types';
import { MOCK_PLAYLISTS } from '@/lib/mockData';

// ─── PlaylistService ──────────────────────────────────────────────────────────

export const PlaylistService = {
  /**
   * Fetch the authenticated user's playlists.
   * Falls back to MOCK_PLAYLISTS if the endpoint is unavailable.
   */
  async getUserPlaylists(): Promise<Playlist[]> {
    try {
      const data = await get<Playlist[] | { data: Playlist[] }>('/api/v1/playlists');
      return Array.isArray(data) ? data : data.data;
    } catch {
      return MOCK_PLAYLISTS;
    }
  },

  /**
   * Fetch a single playlist by ID.
   */
  async getPlaylist(id: string): Promise<Playlist> {
    try {
      return await get<Playlist>(`/api/v1/playlists/${id}`);
    } catch {
      const mock = MOCK_PLAYLISTS.find((p) => p.id === id);
      if (mock) return mock;
      throw new Error(`Playlist with id "${id}" not found`);
    }
  },

  /**
   * Create a new playlist for the authenticated user.
   * Provides an optimistic mock fallback when the endpoint is unavailable.
   */
  async createPlaylist(input: PlaylistCreateInput): Promise<Playlist> {
    try {
      return await post<Playlist>('/api/v1/playlists', input);
    } catch {
      const now = new Date().toISOString();
      const mockPlaylist: Playlist = {
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
      };
      return mockPlaylist;
    }
  },

  /**
   * Add a track to a playlist.
   */
  async addTrack(playlistId: string, trackId: string): Promise<void> {
    await post<void>(`/api/v1/playlists/${playlistId}/songs`, { song_id: trackId });
  },

  /**
   * Remove a track from a playlist.
   */
  async removeTrack(playlistId: string, trackId: string): Promise<void> {
    await del<void>(`/api/v1/playlists/${playlistId}/songs/${trackId}`);
  },

  /**
   * Update playlist metadata (name, description, cover, visibility).
   */
  async updatePlaylist(id: string, updates: PlaylistUpdateInput): Promise<Playlist> {
    const response = await api.patch<Playlist>(`/api/v1/playlists/${id}`, updates);
    return response.data;
  },

  /**
   * Permanently delete a playlist.
   */
  async deletePlaylist(id: string): Promise<void> {
    await del<void>(`/api/v1/playlists/${id}`);
  },
};

export default PlaylistService;
