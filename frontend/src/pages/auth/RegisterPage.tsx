import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const isLoading = useAuthStore((s) => s.isLoading)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password) {
      toast.error('Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    try {
      await register(username, email, password)
      toast.success('Welcome to AURA!')
      navigate('/home', { replace: true })
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Registration failed. Please try again.'
      toast.error(msg)
    }
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
          <p className="mt-2 text-sm text-[#94a3b8]">Create your free account</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#94a3b8] mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl text-sm text-[#f8fafc]',
                  'bg-white/5 border border-white/8 placeholder-[#64748b]',
                  'focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50',
                  'transition-colors',
                )}
              />
            </div>

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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#94a3b8] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={cn(
                    'w-full px-4 py-2.5 pr-10 rounded-xl text-sm text-[#f8fafc]',
                    'bg-white/5 border border-white/8 placeholder-[#64748b]',
                    'focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50',
                    'transition-colors',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full py-2.5 rounded-xl font-semibold text-sm transition-all',
                'bg-violet-600 hover:bg-violet-500 active:scale-95',
                'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
                'flex items-center justify-center gap-2',
              )}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#64748b]">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
