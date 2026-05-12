export interface Track {
  id: string
  title: string
  artist: string
  artistId: string
  album: string
  albumId: string
  duration: number          // seconds
  coverUrl: string
  audioUrl: string
  genre: string
  playCount: number
  likeCount: number
  isLiked?: boolean
  createdAt: string
  updatedAt: string
  // Optional Spotify audio features — populated for recommendation-service tracks
  spotifyId?: string
  valence?: number
  energy?: number
  danceability?: number
  tempo?: number
  acousticness?: number
  instrumentalness?: number
  loudness?: number
  speechiness?: number
}

export interface Album {
  id: string
  title: string
  artistId: string
  artist: string
  coverUrl: string
  releaseYear: number
  genre: string
  trackCount: number
  tracks?: Track[]
  createdAt: string
}

export interface Artist {
  id: string
  name: string
  bio?: string
  avatarUrl: string
  coverUrl?: string
  genre: string
  followerCount: number
  albumCount: number
  trackCount: number
  isFollowed?: boolean
  createdAt: string
}

export interface Genre {
  id: string
  name: string
  color: string
  trackCount: number
}

export type TrackSortField = 'title' | 'artist' | 'playCount' | 'duration' | 'createdAt'
export type SortDirection = 'asc' | 'desc'
