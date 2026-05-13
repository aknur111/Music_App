import { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, X, Shield } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PaymentService } from '@/services/payment.service'

export default function DevCheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paymentId = searchParams.get('payment_id') ?? ''
  const [loading, setLoading] = useState(false)

  async function confirm(success: boolean) {
    if (!paymentId) return
    setLoading(true)
    try {
      await PaymentService.confirmDevPayment(paymentId, success)
      if (success) {
        navigate(`/billing/success?payment_id=${paymentId}`)
      } else {
        navigate('/billing/failure?reason=Payment+cancelled')
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-3xl bg-[#13131f] border border-white/10 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-900/60 to-cyan-900/30 px-6 py-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Dev Checkout</span>
            </div>
            <h2 className="text-lg font-black text-white">Simulated Payment</h2>
            <p className="text-xs text-white/40 mt-1">This page only appears in development mode</p>
          </div>

          <div className="p-6">
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Halyk ePay (mock)</p>
                  <p className="text-xs text-white/40">Payment ID: {paymentId.slice(0, 8)}…</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => confirm(true)}
                disabled={loading || !paymentId}
                className="w-full rounded-2xl py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors shadow-lg shadow-violet-900/30"
              >
                {loading ? 'Processing…' : 'Confirm Payment'}
              </motion.button>
              <button
                onClick={() => confirm(false)}
                disabled={loading}
                className="w-full rounded-2xl py-3.5 border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.04] disabled:opacity-50 text-sm transition-all flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
