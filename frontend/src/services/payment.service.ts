import { get, post } from './api'
import type { Plan, Payment, CheckoutResponse, SubscriptionResponse } from '@/types/payment'

export const PaymentService = {
  async getPlans(): Promise<{ plans: Plan[] }> {
    return get<{ plans: Plan[] }>('/api/v1/payments/plans')
  },

  async createCheckout(planSlug: string, returnUrl: string, failUrl: string): Promise<CheckoutResponse> {
    return post<CheckoutResponse>('/api/v1/payments/checkout', {
      plan_slug: planSlug,
      return_url: returnUrl,
      fail_url: failUrl,
    })
  },

  async getPayment(paymentId: string): Promise<{ payment: Payment }> {
    return get<{ payment: Payment }>(`/api/v1/payments/${paymentId}`)
  },

  async listMyPayments(): Promise<{ payments: Payment[] }> {
    return get<{ payments: Payment[] }>('/api/v1/payments/')
  },

  async getMySubscription(): Promise<SubscriptionResponse> {
    return get<SubscriptionResponse>('/api/v1/payments/subscription')
  },

  async confirmDevPayment(paymentId: string, success: boolean): Promise<{ ok: boolean }> {
    return post<{ ok: boolean }>(`/api/v1/payments/callback/local`, {
      payment_id: paymentId,
      success,
    })
  },
}
