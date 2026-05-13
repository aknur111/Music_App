import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Subscription } from '@/types/payment'
import { PaymentService } from '@/services/payment.service'

interface SubscriptionState {
  subscription: Subscription | null
  hasSubscription: boolean
  isLoading: boolean
  lastFetched: number | null

  fetch: () => Promise<void>
  clear: () => void
  isPremium: () => boolean
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,
      hasSubscription: false,
      isLoading: false,
      lastFetched: null,

      fetch: async () => {
        const { lastFetched, isLoading } = get()
        if (isLoading) return
        if (lastFetched && Date.now() - lastFetched < 30_000) return

        set({ isLoading: true })
        try {
          const data = await PaymentService.getMySubscription()
          set({
            subscription: data.subscription,
            hasSubscription: data.has_subscription,
            isLoading: false,
            lastFetched: Date.now(),
          })
        } catch {
          set({ isLoading: false })
        }
      },

      clear: () => set({ subscription: null, hasSubscription: false, lastFetched: null }),

      isPremium: () => {
        const { subscription, hasSubscription } = get()
        if (!hasSubscription || !subscription) return false
        return subscription.status === 'active' &&
          (subscription.plan_slug === 'premium_monthly' || subscription.plan_slug === 'premium_yearly')
      },
    }),
    {
      name: 'aura-subscription',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        subscription: state.subscription,
        hasSubscription: state.hasSubscription,
        lastFetched: state.lastFetched,
      }),
    },
  ),
)
