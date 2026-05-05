export type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenPair,
  RefreshRequest,
  RegisterResponse,
} from './auth'

export type {
  Track,
  Album,
  Artist,
  Genre,
  TrackSortField,
  SortDirection,
} from './music'

export type {
  Playlist,
  PlaylistCreateInput,
  PlaylistUpdateInput,
  PlaylistAddTrackInput,
} from './playlist'

// ─── API helpers ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ApiError {
  message: string
  code?: string
  statusCode?: number
}
