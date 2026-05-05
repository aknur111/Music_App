import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Music2, Headphones, Zap } from 'lucide-react'

const features = [
  {
    icon: Music2,
    title: 'Vast Library',
    description: 'Access millions of tracks across every genre imaginable.',
  },
  {
    icon: Headphones,
    title: 'Lossless Audio',
    description: 'Experience music the way the artist intended — crystal clear.',
  },
  {
    icon: Zap,
    title: 'Instant Streaming',
    description: 'Near-zero latency playback powered by a global CDN.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#06060e] text-[#f8fafc] flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-5">
        <span className="text-xl font-bold tracking-widest text-gradient">AURA</span>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-[#94a3b8] hover:text-[#f8fafc] transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 text-sm font-semibold rounded-full bg-violet-600 hover:bg-violet-500 transition-colors shadow-glow"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-violet-300 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Premium Music Streaming
          </div>

          <h1 className="text-6xl sm:text-7xl font-black tracking-tight mb-6 leading-none">
            Hear music{' '}
            <span className="text-gradient">differently</span>
          </h1>

          <p className="text-lg text-[#94a3b8] mb-10 max-w-xl mx-auto leading-relaxed">
            AURA delivers lossless audio, curated discovery, and a listening experience crafted
            for people who take music seriously.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 font-semibold text-base transition-all shadow-glow hover:shadow-glow-lg active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              Start listening free
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-full glass font-medium text-base hover:bg-white/8 transition-all active:scale-95"
            >
              Sign in
            </Link>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          className="relative z-10 mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto w-full"
        >
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="glass rounded-2xl p-6 text-left hover:bg-white/6 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="font-semibold text-[#f8fafc] mb-1">{title}</h3>
              <p className="text-sm text-[#94a3b8] leading-relaxed">{description}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[#64748b]">
        &copy; {new Date().getFullYear()} AURA. All rights reserved.
      </footer>
    </div>
  )
}
