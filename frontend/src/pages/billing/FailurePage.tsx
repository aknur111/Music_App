import { motion } from 'framer-motion'
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function BillingFailurePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reason = searchParams.get('reason')

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-sm text-center"
      >
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-white mb-2">Payment failed</h2>
        <p className="text-sm text-white/40 mb-2">
          {reason ? reason : 'Your payment could not be completed.'}
        </p>
        <p className="text-xs text-white/25 mb-8">
          No charge was made to your account. You can try again at any time.
        </p>
        <div className="flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/premium')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-violet-900/40"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </motion.button>
          <button
            onClick={() => navigate('/home')}
            className="inline-flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </div>
      </motion.div>
    </div>
  )
}
