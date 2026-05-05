import { get } from '@/services/api';
import type { Track, Album, Artist } from '@/types';
import { DEMO_TRACKS, DEMO_ALBUMS, DEMO_ARTISTS } from '@/lib/constants';

// ─── MusicService ─────────────────────────────────────────────────────────────

export const MusicService = {
  /**
   * Fetch a paginated list of tracks.
   * Falls back to DEMO_TRACKS if the endpoint is unavailable.
   */
  async getTracks(page = 1, limit = 20): Promise<Track[]> {
    try {
      const data = await get<Track[] | { data: Track[] }>('/api/v1/songs', { page, limit });
      return Array.isArray(data) ? data : data.data;
    } catch {
      return DEMO_TRACKS;
    }
  },

  /**
   * Fetch a single track by ID.
   * Falls back to the matching demo track, or throws if not found.
   */
  async getTrack(id: string): Promise<Track> {
    try {
      return await get<Track>(`/api/v1/songs/${id}`);
    } catch {
      const demo = DEMO_TRACKS.find((t) => t.id === id);
      if (demo) return demo;
      throw new Error(`Track with id "${id}" not found`);
    }
  },

  /**
   * Search tracks by a query string.
   * Falls back to a client-side filter over DEMO_TRACKS.
   */
  async searchTracks(query: string): Promise<Track[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const data = await get<Track[] | { data: Track[] }>('/api/v1/songs/search', { q: trimmed });
      return Array.isArray(data) ? data : data.data;
    } catch {
      const q = trimmed.toLowerCase();
      return DEMO_TRACKS.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q),
      );
    }
  },

  /**
   * Fetch all albums. Mocked until the backend endpoint is live.
   */
  async getAlbums(): Promise<Album[]> {
    try {
      const data = await get<Album[] | { data: Album[] }>('/api/v1/albums');
      return Array.isArray(data) ? data : data.data;
    } catch {
      return DEMO_ALBUMS;
    }
  },

  /**
   * Fetch a single album by ID.
   */
  async getAlbum(id: string): Promise<Album> {
    try {
      return await get<Album>(`/api/v1/albums/${id}`);
    } catch {
      const demo = DEMO_ALBUMS.find((a) => a.id === id);
      if (demo) return demo;
      throw new Error(`Album with id "${id}" not found`);
    }
  },

  /**
   * Fetch all artists. Mocked until the backend endpoint is live.
   */
  async getArtists(): Promise<Artist[]> {
    try {
      const data = await get<Artist[] | { data: Artist[] }>('/api/v1/artists');
      return Array.isArray(data) ? data : data.data;
    } catch {
      return DEMO_ARTISTS;
    }
  },
};

export default MusicService;
