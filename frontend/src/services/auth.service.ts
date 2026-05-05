import { post, get } from '@/services/api';
import type { AuthResponse, RegisterResponse, User } from '@/types';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const ACCESS_TOKEN_KEY = 'aura_access_token';
const REFRESH_TOKEN_KEY = 'aura_refresh_token';
const EXPIRES_AT_KEY = 'aura_expires_at';

// ─── Mock profile for demo / 404 fallback ────────────────────────────────────

const MOCK_PROFILE: User = {
  id: 'demo-user',
  username: 'aura_listener',
  email: 'listener@aura.music',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
  role: 'user',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── AuthService ──────────────────────────────────────────────────────────────

export const AuthService = {
  /**
   * Authenticate a user, persist tokens, and return the auth payload.
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await post<AuthResponse>('/api/v1/auth/login', { email, password });
    AuthService.storeTokens(data.access_token, data.refresh_token, data.expires_at);
    return data;
  },

  /**
   * Create a new account. Accepts a username (maps to `name` parameter used in
   * the UI), email, and password. Returns the server-assigned user ID.
   */
  async register(name: string, email: string, password: string): Promise<{ userId: string }> {
    const data = await post<RegisterResponse>('/api/v1/auth/register', {
      name,
      email,
      password,
    });
    return { userId: data.user_id };
  },

  /**
   * Clear all persisted auth tokens and sign the user out.
   */
  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  },

  /**
   * Exchange the stored refresh token for a fresh access token pair.
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = AuthService.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const data = await post<AuthResponse>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });
    AuthService.storeTokens(data.access_token, data.refresh_token, data.expires_at);
    return data;
  },

  /**
   * Fetch the current user's profile. Falls back to mock data if the
   * endpoint returns 404 (not yet live) or any other network error.
   */
  async getProfile(): Promise<User> {
    try {
      return await get<User>('/api/v1/auth/profile');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (!status || status === 404) {
        return MOCK_PROFILE;
      }
      throw err;
    }
  },

  /**
   * Persist the three token values to localStorage.
   */
  storeTokens(access: string, refresh: string, expiresAt: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem(EXPIRES_AT_KEY, expiresAt);
  },

  /** Read the stored access token. */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  /** Read the stored refresh token. */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Return true when an access token is stored and has not yet expired.
   */
  isAuthenticated(): boolean {
    const token = AuthService.getAccessToken();
    if (!token) return false;

    const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
    if (!expiresAt) return true; // No expiry info — treat as valid

    try {
      return new Date(expiresAt).getTime() > Date.now();
    } catch {
      return true;
    }
  },
};

export default AuthService;
