import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Zap, Star, Music2, Headphones, Radio, Shield, Sparkles, Infinity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PaymentService } from '@/services/payment.service'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import type { Plan } from '@/types/payment'

const FREE_FEATURES = [
  'Access to AURA music library',
  'Basic recommendations',
  'Up to 3 playlists',
  'Standard audio quality',
]

const PREMIUM_FEATURES = [
  'Everything in Free',
  'Unlimited playlists',
  'Advanced AI recommendations',
  'My Wave personalised radio',
  'High-quality audio',
  'Offline favourites',
  'Early access to new features',
]

const PERKS = [
  { icon: Radio,    label: 'My Wave',        desc: 'Infinite personalised radio that learns your taste' },
  { icon: Sparkles, label: 'Smart AI',        desc: 'ML picks tracks based on mood, energy and danceability' },
  { icon: Infinity, label: 'Unlimited',       desc: 'No limits on playlists, skips or queue size' },
  { icon: Headphones, label: 'Hi-Fi Audio',   desc: 'Lossless quality where available' },
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
  const yearlyPlan  = paidPlans.find((p) => p.slug === 'premium_yearly')

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
    } catch {
      setCheckingOut(null)
    }
  }

  const isAlreadyPremium =
    hasSubscription && subscription?.status === 'active' && subscription.plan_slug !== 'free'

  return (
    <div className="relative min-h-full pb-32 overflow-hidden">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full bg-amber-500/8 blur-[120px]" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute bottom-40 left-0 w-[300px] h-[300px] rounded-full bg-orange-600/8 blur-[90px]" />
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="p-6 max-w-3xl">

        {/* Hero */}
        <motion.div variants={item} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/40">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-none">Aura Premium</h1>
              <p className="text-white/40 text-sm mt-0.5">Your music, fully unlocked</p>
            </div>
          </div>
        </motion.div>

        {/* Already premium banner */}
        {isAlreadyPremium && (
          <motion.div variants={item} className="mb-6 rounded-2xl bg-gradient-to-r from-violet-600/20 to-amber-600/10 border border-violet-500/30 p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-violet-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">You're on {subscription?.plan_name}</p>
              {subscription?.expires_at && (
                <p className="text-xs text-white/40 mt-0.5">
                  Renews {new Date(subscription.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Perks grid */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3 mb-8">
          {PERKS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Free vs Premium */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Free */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Music2 className="w-4 h-4 text-white/40" />
              <span className="text-sm font-semibold text-white/50">Free</span>
            </div>
            <div className="text-2xl font-black text-white/70 mb-4">0 ₸</div>
            <ul className="space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/40">
                  <Check className="w-4 h-4 text-white/25 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Premium */}
          <div className="relative rounded-2xl bg-gradient-to-br from-amber-900/30 via-orange-900/20 to-violet-900/30 border border-amber-500/30 p-5 overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-amber-400 to-orange-500 text-black px-2.5 py-0.5 rounded-full">
                Best value
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Premium</span>
            </div>
            <div className="text-2xl font-black text-white mb-4">
              from 1 990 ₸<span className="text-sm font-normal text-white/40">/mo</span>
            </div>
            <ul className="space-y-2.5">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                  <Check className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Plan picker */}
        <motion.div variants={item} className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/25 mb-3">Choose a plan</p>
          {loading ? (
            <div className="flex gap-3">
              {[0, 1].map((i) => <div key={i} className="flex-1 h-32 rounded-2xl bg-white/[0.04] animate-pulse" />)}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              {[monthlyPlan, yearlyPlan].filter(Boolean).map((plan) => {
                if (!plan) return null
                const isYearly = plan.slug === 'premium_yearly'
                const isCurrentPlan = subscription?.plan_slug === plan.slug && subscription?.status === 'active'

                return (
                  <motion.div
                    key={plan.id}
                    whileHover={{ scale: 1.02 }}
                    className={`flex-1 rounded-2xl border p-5 relative overflow-hidden transition-all ${
                      isYearly
                        ? 'border-amber-500/40 bg-gradient-to-br from-amber-900/20 to-orange-900/10'
                        : 'border-white/[0.08] bg-white/[0.03]'
                    }`}
                  >
                    {isYearly && (
                      <div className="absolute top-3 right-3 text-[10px] font-bold bg-amber-500 text-black px-2 py-0.5 rounded-full">
                        Save 16%
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      {isYearly
                        ? <Radio className="w-4 h-4 text-amber-400" />
                        : <Headphones className="w-4 h-4 text-white/50" />}
                      <span className="text-sm font-semibold text-white">{plan.name}</span>
                    </div>
                    <div className="text-2xl font-black text-white mb-0.5">
                      {plan.price_kzt.toLocaleString('ru-KZ')} ₸
                    </div>
                    <div className="text-xs text-white/35 mb-4">
                      {isYearly
                        ? `${Math.round(plan.price_kzt / 12).toLocaleString('ru-KZ')} ₸/month billed yearly`
                        : 'billed monthly'}
                    </div>

                    {isCurrentPlan ? (
                      <div className="w-full rounded-xl py-2.5 text-sm font-semibold text-center text-amber-400 border border-amber-500/30 bg-amber-500/10">
                        Current plan
                      </div>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleCheckout(plan)}
                        disabled={checkingOut !== null}
                        className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
                          isYearly
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-orange-900/30'
                            : 'bg-white/10 hover:bg-white/15 text-white'
                        }`}
                      >
                        {checkingOut === plan.slug ? 'Redirecting…' : isAlreadyPremium ? 'Switch plan' : 'Get Premium'}
                      </motion.button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        <motion.div variants={item} className="text-center space-y-2">
          <p className="text-xs text-white/25">
            Payments processed via Halyk Bank. Prices in Kazakhstani Tenge (₸).
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="text-xs text-amber-400/50 hover:text-amber-400 transition-colors"
          >
            View subscription status →
          </button>
        </motion.div>

      </motion.div>
    </div>
  )
}
