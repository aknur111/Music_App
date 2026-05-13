export interface Plan {
  id: string
  slug: string
  name: string
  description: string
  price_kzt: number
  duration_days: number
  is_active: boolean
}

export interface Payment {
  id: string
  user_id: string
  plan_id: string
  plan_name: string
  provider_id: string
  provider_ref: string
  amount_kzt: number
  status: 'created' | 'pending' | 'paid' | 'failed' | 'refunded'
  checkout_url: string
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  plan_slug: string
  plan_name: string
  status: 'pending' | 'active' | 'expired' | 'canceled'
  starts_at: string
  expires_at: string
  created_at: string
}

export interface CheckoutResponse {
  payment_id: string
  checkout_url: string
  provider_ref: string
}

export interface SubscriptionResponse {
  subscription: Subscription | null
  has_subscription: boolean
}
