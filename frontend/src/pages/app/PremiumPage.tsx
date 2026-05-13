import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Zap, Star, Music, Headphones, Radio, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PaymentService } from '@/services/payment.service'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import type { Plan } from '@/types/payment'

const FREE_FEATURES = [
  'Access to Jamendo library',
  'Basic recommendations',
  'Create up to 3 playlists',
  'Standard audio quality',
]

const PREMIUM_FEATURES = [
  'Everything in Free',
  'Unlimited playlists',
  'Advanced AI recommendations',
  'My Wave personalized radio',
  'Priority audio quality',
  'Offline favorites',
  'No interruptions',
]

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } } }

export default function PremiumPage() {
  const navigate = useNavigate()
  const { subscription, hasSubscription, fetch: fetchSub } = useSubscriptionStore()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  useEffect(() => {
    PaymentService.getPlans()
      .then((data) => setPlans(data.plans ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
    fetchSub()
  }, [fetchSub])

  const paidPlans = plans.filter((p) => p.price_kzt > 0)
  const monthlyPlan = paidPlans.find((p) => p.slug === 'premium_monthly')
  const yearlyPlan = paidPlans.find((p) => p.slug === 'premium_yearly')

  async function handleCheckout(plan: Plan) {
    setCheckingOut(plan.slug)
    try {
      const origin = window.location.origin
      const result = await PaymentService.createCheckout(
        plan.slug,
        `${origin}/billing/success`,
        `${origin}/billing/failure`,
      )
      window.location.href = result.checkout_url
    } catch (err) {
      console.error('Checkout failed', err)
      setCheckingOut(null)
    }
  }

  const isAlreadyPremium = hasSubscription &&
    subscription?.status === 'active' &&
    subscription.plan_slug !== 'free'

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-6 pb-32 max-w-3xl"
    >
      <motion.div variants={item} className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Aura Premium</h1>
        </div>
        <p className="text-white/50 text-sm">Unlock your full music experience</p>
      </motion.div>

      {isAlreadyPremium && (
        <motion.div variants={item} className="mb-6 rounded-2xl bg-gradient-to-r from-violet-600/20 to-cyan-600/10 border border-violet-500/30 p-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-violet-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">You are on {subscription?.plan_name}</p>
            {subscription?.expires_at && (
              <p className="text-xs text-white/40 mt-0.5">
                Renews on {new Date(subscription.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Free vs Premium comparison */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Free tier */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Music className="w-4 h-4 text-white/40" />
            <span className="text-sm font-semibold text-white/60">Free</span>
          </div>
          <div className="text-2xl font-black text-white/80 mb-4">0 ₸</div>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-white/50">
                <Check className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Premium tier */}
        <div className="relative rounded-2xl bg-gradient-to-br from-violet-900/40 to-cyan-900/20 border border-violet-500/30 p-5 overflow-hidden">
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-amber-400 to-orange-500 text-black px-2 py-0.5 rounded-full">
              Popular
            </span>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-violet-500/10 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">Premium</span>
          </div>
          <div className="text-2xl font-black text-white mb-4">
            from 1 990 ₸<span className="text-sm font-normal text-white/40">/mo</span>
          </div>
          <ul className="space-y-2.5">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Plans */}
      <motion.div variants={item} className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/25 mb-3">Choose your plan</p>
        {loading ? (
          <div className="flex gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="flex-1 h-28 rounded-2xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            {[monthlyPlan, yearlyPlan].filter(Boolean).map((plan) => {
              if (!plan) return null
              const isYearly = plan.slug === 'premium_yearly'
              const saving = isYearly ? 'Save 16%' : null
              const isCurrentPlan = subscription?.plan_slug === plan.slug && subscription?.status === 'active'

              return (
                <motion.div
                  key={plan.id}
                  whileHover={{ scale: 1.02 }}
                  className={`flex-1 rounded-2xl border p-4 cursor-pointer transition-all relative overflow-hidden ${
                    isYearly
                      ? 'border-violet-500/40 bg-violet-500/10'
                      : 'border-white/[0.08] bg-white/[0.03]'
                  }`}
                >
                  {saving && (
                    <div className="absolute top-3 right-3 text-[10px] font-bold bg-violet-500 text-white px-2 py-0.5 rounded-full">
                      {saving}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    {isYearly ? <Radio className="w-4 h-4 text-violet-400" /> : <Headphones className="w-4 h-4 text-white/50" />}
                    <span className="text-sm font-semibold text-white">{plan.name}</span>
                  </div>
                  <div className="text-xl font-black text-white mb-1">
                    {plan.price_kzt.toLocaleString('ru-KZ')} ₸
                  </div>
                  <div className="text-xs text-white/40 mb-4">
                    {isYearly
                      ? `${Math.round(plan.price_kzt / 12).toLocaleString('ru-KZ')} ₸/month`
                      : 'per month'}
                  </div>

                  {isCurrentPlan ? (
                    <div className="w-full rounded-xl py-2.5 text-sm font-semibold text-center text-violet-400 border border-violet-500/30 bg-violet-500/10">
                      Current plan
                    </div>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleCheckout(plan)}
                      disabled={checkingOut !== null}
                      className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
                        isYearly
                          ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30'
                          : 'bg-white/10 hover:bg-white/15 text-white'
                      }`}
                    >
                      {checkingOut === plan.slug ? 'Redirecting…' : isAlreadyPremium ? 'Change plan' : 'Get Premium'}
                    </motion.button>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      <motion.div variants={item} className="text-center">
        <p className="text-xs text-white/25">
          No recurring auto-charge. Manual renewal only. Prices in Kazakhstani Tenge.
        </p>
        <button
          onClick={() => navigate('/profile')}
          className="mt-3 text-xs text-violet-400/60 hover:text-violet-400 transition-colors"
        >
          View my subscription status
        </button>
      </motion.div>
    </motion.div>
  )
}
