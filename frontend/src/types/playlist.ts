import type { Track } from './music'

export interface Playlist {
  id: string
  name: string
  description: string
  coverUrl: string
  trackIds: string[]
  tracks?: Track[]
  ownerId: string
  ownerName?: string
  isPublic: boolean
  followerCount: number
  createdAt: string
  updatedAt: string
}

export interface PlaylistCreateInput {
  name: string
  description?: string
  coverUrl?: string
  isPublic?: boolean
}

export interface PlaylistUpdateInput {
  name?: string
  description?: string
  coverUrl?: string
  isPublic?: boolean
}

export interface PlaylistAddTrackInput {
  playlistId: string
  trackId: string
}
