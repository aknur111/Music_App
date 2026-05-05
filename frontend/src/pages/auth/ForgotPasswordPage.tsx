import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    // Simulate API call — password reset endpoint not yet implemented
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    setSent(true)
  }

  return (
    <div className="min-h-dvh bg-[#06060e] flex items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-black tracking-widest text-gradient">
            AURA
          </Link>
          <p className="mt-2 text-sm text-[#94a3b8]">Reset your password</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-violet-400 mx-auto mb-4" />
              <h2 className="font-semibold text-[#f8fafc] mb-2">Check your email</h2>
              <p className="text-sm text-[#94a3b8] mb-6">
                If an account exists for <span className="text-[#f8fafc]">{email}</span>, you'll
                receive a reset link shortly.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#94a3b8] mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#94a3b8] mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm text-[#f8fafc]',
                      'bg-white/5 border border-white/8 placeholder-[#64748b]',
                      'focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50',
                      'transition-colors',
                    )}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className={cn(
                    'w-full py-2.5 rounded-xl font-semibold text-sm transition-all',
                    'bg-violet-600 hover:bg-violet-500 active:scale-95',
                    'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
                    'flex items-center justify-center gap-2',
                  )}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
