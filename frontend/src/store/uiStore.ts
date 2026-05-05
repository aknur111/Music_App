import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ─── State interface ──────────────────────────────────────────────────────────

interface UiState {
  sidebarCollapsed: boolean
  theme: 'dark'
  searchQuery: string
  activeModal: string | null

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSearchQuery: (query: string) => void
  openModal: (modalId: string) => void
  closeModal: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      // ── Initial state ────────────────────────────────────────────────────
      sidebarCollapsed: false,
      theme: 'dark',
      searchQuery: '',
      activeModal: null,

      // ── Actions ──────────────────────────────────────────────────────────
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed: boolean) =>
        set({ sidebarCollapsed: collapsed }),

      setSearchQuery: (query: string) => set({ searchQuery: query }),

      openModal: (modalId: string) => set({ activeModal: modalId }),

      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'aura-ui',
      storage: createJSONStorage(() => localStorage),
      // Only persist layout preferences, not ephemeral UI state
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    },
  ),
)

export default useUiStore
