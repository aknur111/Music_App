export interface User {
  id: string
  username: string
  email: string
  avatarUrl?: string
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
}

export interface RefreshRequest {
  refresh_token: string
}

export interface RegisterResponse {
  user_id: string
}
