import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { PaymentService } from '@/services/payment.service'

export default function BillingSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paymentId = searchParams.get('payment_id')
  const { fetch: fetchSub, clear } = useSubscriptionStore()

  const [status, setStatus] = useState<'loading' | 'success' | 'pending'>('loading')

  useEffect(() => {
    clear()
    let attempts = 0
    const maxAttempts = 8

    async function poll() {
      try {
        if (paymentId) {
          const data = await PaymentService.getPayment(paymentId)
          if (data.payment?.status === 'paid') {
            await fetchSub()
            setStatus('success')
            return
          }
        } else {
          await fetchSub()
          setStatus('success')
          return
        }
      } catch {
        // ignore
      }

      attempts++
      if (attempts >= maxAttempts) {
        setStatus('pending')
        return
      }
      setTimeout(poll, 1500)
    }

    poll()
  }, [paymentId, fetchSub, clear])

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-sm text-center"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-violet-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-black text-white mb-2">Confirming your payment…</h2>
            <p className="text-sm text-white/40">This usually takes just a moment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-black text-white mb-2">Welcome to Premium!</h2>
            <p className="text-sm text-white/50 mb-8">Your subscription is now active. Enjoy the full Aura experience.</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/home')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-violet-900/40"
            >
              Start Listening
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </>
        )}

        {status === 'pending' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-black text-white mb-2">Payment received</h2>
            <p className="text-sm text-white/40 mb-6">
              Your payment is being verified. Your subscription will activate shortly.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/premium')}
                className="px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
              >
                View subscription status
              </button>
              <button
                onClick={() => navigate('/home')}
                className="text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Go to home
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
