import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types'

// ─── useAuth ──────────────────────────────────────────────────────────────────
//
// Thin selector hook over authStore. Components should import this rather than
// useAuthStore directly so that the underlying store can be swapped without
// touching every consumer.

export interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const error = useAuthStore((s) => s.error)
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const logout = useAuthStore((s) => s.logout)
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const clearError = useAuthStore((s) => s.clearError)

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    error,
    login,
    register,
    logout,
    checkAuth,
    clearError,
  }
}

export default useAuth
