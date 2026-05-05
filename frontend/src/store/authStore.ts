import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, AuthResponse } from '@/types'
import { authApi } from '@/lib/api'

// ─── Token storage keys ───────────────────────────────────────────────────────

const ACCESS_TOKEN_KEY = 'aura_access_token'
const REFRESH_TOKEN_KEY = 'aura_refresh_token'
const EXPIRES_AT_KEY = 'aura_expires_at'

// ─── State interface ──────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  error: string | null

  // Legacy / store-internal helpers
  initialize: () => void
  register: (username: string, email: string, password: string) => Promise<void>
  refreshAccessToken: () => Promise<boolean>
  clearError: () => void

  // Required public API
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
  setTokens: (auth: AuthResponse) => void
  checkAuth: () => Promise<void>
  setLoading: (loading: boolean) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function persistTokens(access: string, refresh: string, expiresAt: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  localStorage.setItem(EXPIRES_AT_KEY, expiresAt)
}

function clearPersistedTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
}

function isTokenValid(): boolean {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (!token) return false
  const expiresAt = localStorage.getItem(EXPIRES_AT_KEY)
  if (!expiresAt) return true
  try {
    return new Date(expiresAt).getTime() > Date.now()
  } catch {
    return true
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────────
      user: null,
      accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
      refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
      isAuthenticated: isTokenValid(),
      isAdmin: false,
      isLoading: false,
      error: null,

      // ── initialize ─────────────────────────────────────────────────────────
      initialize: () => {
        const valid = isTokenValid()
        if (!valid) {
          clearPersistedTokens()
          set({ isAuthenticated: false, accessToken: null, refreshToken: null })
        } else {
          set({
            accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
            refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
            isAuthenticated: true,
          })
        }
      },

      // ── login ──────────────────────────────────────────────────────────────
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const data: AuthResponse = await authApi.login({ email, password })
          persistTokens(data.access_token, data.refresh_token, data.expires_at)

          // Fetch profile; tolerate 404 for endpoints not yet live
          let user: User | null = null
          try {
            user = await authApi.profile()
          } catch {
            user = null
          }

          set({
            user,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isAuthenticated: true,
            isAdmin: user?.role === 'admin',
            isLoading: false,
            error: null,
          })
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Login failed'
          set({ isLoading: false, error: message, isAuthenticated: false })
          throw err
        }
      },

      // ── register ───────────────────────────────────────────────────────────
      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          await authApi.register({ name: username, email, password })
          // Auto-login after successful registration
          const data: AuthResponse = await authApi.login({ email, password })
          persistTokens(data.access_token, data.refresh_token, data.expires_at)
          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (err: unknown) {
          const serverMsg = (err as { response?: { data?: unknown } })?.response?.data
          const message =
            typeof serverMsg === 'string' && serverMsg.trim()
              ? serverMsg.trim()
              : err instanceof Error
                ? err.message
                : 'Registration failed'
          set({ isLoading: false, error: message })
          throw new Error(message)
        }
      },

      // ── logout ─────────────────────────────────────────────────────────────
      logout: () => {
        clearPersistedTokens()
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isAdmin: false,
          error: null,
        })
      },

      // ── setUser ────────────────────────────────────────────────────────────
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: user !== null, isAdmin: user?.role === 'admin' })
      },

      // ── setTokens ──────────────────────────────────────────────────────────
      setTokens: (auth: AuthResponse) => {
        persistTokens(auth.access_token, auth.refresh_token, auth.expires_at)
        set({ accessToken: auth.access_token, refreshToken: auth.refresh_token, isAuthenticated: true })
      },

      // ── checkAuth ──────────────────────────────────────────────────────────
      checkAuth: async () => {
        if (!isTokenValid()) {
          clearPersistedTokens()
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
          return
        }

        const { isAuthenticated } = get()
        if (!isAuthenticated) return

        set({ isLoading: true })
        try {
          const user = await authApi.profile()
          set({
            user,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            isLoading: false,
          })
        } catch {
          clearPersistedTokens()
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false })
        }
      },

      // ── setLoading ─────────────────────────────────────────────────────────
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // ── refreshAccessToken ─────────────────────────────────────────────────
      refreshAccessToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) return false
        try {
          const data: AuthResponse = await authApi.refresh({ refresh_token: refreshToken })
          persistTokens(data.access_token, data.refresh_token, data.expires_at)
          set({ accessToken: data.access_token, refreshToken: data.refresh_token })
          return true
        } catch {
          get().logout()
          return false
        }
      },

      // ── clearError ─────────────────────────────────────────────────────────
      clearError: () => set({ error: null }),
    }),
    {
      name: 'aura-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    },
  ),
)

export default useAuthStore
