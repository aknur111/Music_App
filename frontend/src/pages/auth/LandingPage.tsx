import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import { Zap, Compass, Library, Play, ChevronRight } from 'lucide-react'

// ─── Particle Field ───────────────────────────────────────────────────────────

interface Particle {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  opacity: number
  hue: number
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      particlesRef.current = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.5 + 0.1,
        hue: Math.random() < 0.6 ? 265 : 190,
      }))
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity})`
        ctx.fill()
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
}

// ─── Animated Count-Up ───────────────────────────────────────────────────────

function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 })
  const display = useTransform(spring, (v) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
    return `${Math.floor(v)}`
  })

  useEffect(() => {
    if (isInView) motionVal.set(target)
  }, [isInView, motionVal, target])

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  )
}

// ─── Waveform Visual ─────────────────────────────────────────────────────────

function WaveformBars({ count = 28 }: { count?: number }) {
  return (
    <div className="flex items-end gap-[3px] h-10">
      {Array.from({ length: count }).map((_, i) => {
        const baseHeight = 20 + Math.sin(i * 0.8) * 14 + Math.cos(i * 1.3) * 8
        return (
          <motion.div
            key={i}
            className="w-[3px] rounded-full"
            style={{ background: 'linear-gradient(to top, #7c3aed, #06b6d4)' }}
            animate={{
              height: [
                `${baseHeight}px`,
                `${baseHeight * (0.4 + Math.random() * 0.8)}px`,
                `${baseHeight}px`,
              ],
            }}
            transition={{
              duration: 0.8 + Math.random() * 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.04,
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Floating Album Card ──────────────────────────────────────────────────────

interface AlbumCardProps {
  title: string
  artist: string
  gradient: string
  delay?: number
  floatY?: number[]
  style?: React.CSSProperties
}

function FloatingAlbumCard({
  title,
  artist,
  gradient,
  delay = 0,
  floatY = [0, -12, 0],
  style,
}: AlbumCardProps) {
  return (
    <motion.div
      className="absolute glass rounded-2xl p-3 flex items-center gap-3 min-w-[180px] shadow-2xl"
      animate={{ y: floatY }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
      style={style}
    >
      <div
        className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg"
        style={{ background: gradient }}
      >
        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
      </div>
      <div className="overflow-hidden">
        <p className="text-white text-xs font-semibold truncate">{title}</p>
        <p className="text-white/50 text-[10px] truncate">{artist}</p>
      </div>
      <div className="flex items-end gap-[2px] h-5 ml-auto pr-1">
        {[1, 2, 3].map((b) => (
          <motion.div
            key={b}
            className="w-[2px] bg-violet-400 rounded-full"
            animate={{ height: ['4px', '14px', '4px'] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: b * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
  delay?: number
}

function FeatureCard({ icon, title, description, gradient, delay = 0 }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className="group relative glass rounded-2xl p-7 overflow-hidden hover:bg-white/[0.07] transition-colors duration-300"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${gradient.includes('7c3aed') ? 'rgba(124,58,237,0.12)' : gradient.includes('06b6d4') ? 'rgba(6,182,212,0.12)' : 'rgba(244,114,182,0.12)'} 0%, transparent 70%)`,
        }}
      />
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 shadow-lg"
        style={{ background: gradient }}
      >
        {icon}
      </div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}

// ─── Features Heading ─────────────────────────────────────────────────────────

function FeaturesHeading() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
      className="text-center mb-16"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-violet-400 mb-4 font-medium">
        Why AURA
      </p>
      <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
        Built for music lovers.
      </h2>
      <p className="text-white/40 text-lg max-w-xl mx-auto">
        Everything you need to discover, enjoy and share the music that moves you.
      </p>
    </motion.div>
  )
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CTABanner() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.8 }}
      className="relative rounded-3xl overflow-hidden p-12 text-center"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(6,182,212,0.15) 100%)',
        border: '1px solid rgba(124,58,237,0.3)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 70%)',
        }}
      />
      <h2 className="relative text-4xl sm:text-5xl font-black text-white mb-4">
        Ready to feel the music?
      </h2>
      <p className="relative text-white/50 text-lg mb-8 max-w-lg mx-auto">
        Join 150 million listeners. Start for free — no credit card required.
      </p>
      <Link
        to="/register"
        className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-base shadow-2xl shadow-violet-900/50 hover:scale-105 active:scale-100 transition-transform"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
      >
        <Play className="w-4 h-4 fill-white" />
        Start Listening Free
      </Link>
    </motion.div>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────────

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#06060e] text-white overflow-x-hidden">
      {/* ── Navbar ── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        animate={{
          backgroundColor: navScrolled ? 'rgba(6,6,14,0.85)' : 'rgba(0,0,0,0)',
          backdropFilter: navScrolled ? 'blur(20px)' : 'blur(0px)',
        }}
        style={{
          borderBottom: navScrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xl font-black tracking-[0.2em] text-gradient"
          >
            AURA
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/40"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated gradient bg */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              'radial-gradient(ellipse at 15% 60%, rgba(124,58,237,0.35) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(6,182,212,0.2) 0%, transparent 50%), #06060e',
              'radial-gradient(ellipse at 70% 30%, rgba(124,58,237,0.3) 0%, transparent 55%), radial-gradient(ellipse at 20% 70%, rgba(6,182,212,0.25) 0%, transparent 50%), #06060e',
              'radial-gradient(ellipse at 40% 80%, rgba(124,58,237,0.32) 0%, transparent 55%), radial-gradient(ellipse at 75% 50%, rgba(6,182,212,0.18) 0%, transparent 50%), #06060e',
              'radial-gradient(ellipse at 15% 60%, rgba(124,58,237,0.35) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(6,182,212,0.2) 0%, transparent 50%), #06060e',
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />

        {/* Ambient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/5 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/5 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />

        <ParticleField />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 flex flex-col lg:flex-row items-center gap-16">
          {/* Left — Text */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-xs font-medium text-white/60 uppercase tracking-widest"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Now streaming 50M+ tracks
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35 }}
              className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-[0.12em] leading-none mb-4"
            >
              <span
                className="block"
                style={{
                  background:
                    'linear-gradient(135deg, #c4b5fd 0%, #7c3aed 30%, #06b6d4 70%, #a5f3fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 40px rgba(124,58,237,0.5))',
                }}
              >
                AURA
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-2xl sm:text-3xl font-light text-white/60 mb-4 tracking-wide"
            >
              Your music.{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #a78bfa, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Reimagined.
              </span>
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65 }}
              className="text-base text-white/40 mb-10 max-w-md mx-auto lg:mx-0 leading-relaxed"
            >
              Experience sound like never before. Discover, stream and feel every beat with
              audiophile-grade quality and AI-powered discovery.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                to="/register"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base overflow-hidden transition-all duration-300 hover:scale-105 active:scale-100 shadow-2xl shadow-violet-900/50"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              >
                <span className="relative flex items-center gap-2">
                  <Play className="w-4 h-4 fill-white" />
                  Start Listening
                </span>
              </Link>

              <Link
                to="/login"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base glass hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-100"
              >
                Sign In
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-10 flex items-center gap-4"
            >
              <p className="text-xs text-white/30 uppercase tracking-widest">Now Playing</p>
              <WaveformBars count={24} />
            </motion.div>
          </div>

          {/* Right — App Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex-1 relative h-[480px] w-full max-w-[480px] hidden lg:block"
          >
            {/* Ambient glow behind disc */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(124,58,237,0.3) 0%, rgba(6,182,212,0.15) 50%, transparent 70%)',
                filter: 'blur(30px)',
              }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Orbit rings */}
            {[120, 180, 240].map((size, i) => (
              <motion.div
                key={size}
                className="absolute top-1/2 left-1/2 rounded-full border border-white/[0.06]"
                style={{
                  width: size,
                  height: size,
                  marginLeft: -size / 2,
                  marginTop: -size / 2,
                }}
                animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                transition={{ duration: 15 + i * 5, repeat: Infinity, ease: 'linear' }}
              />
            ))}

            {/* Central spinning disc */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                className="w-40 h-40 rounded-full flex items-center justify-center shadow-2xl relative"
                style={{
                  background: 'linear-gradient(135deg, #1a0a2e, #0a1a2e)',
                  border: '2px solid rgba(124,58,237,0.4)',
                  boxShadow: '0 0 60px rgba(124,58,237,0.3), inset 0 0 40px rgba(6,182,212,0.05)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <div
                  className="w-20 h-20 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    boxShadow: '0 0 30px rgba(124,58,237,0.5)',
                  }}
                />
                <div className="absolute w-6 h-6 rounded-full bg-[#06060e] border-2 border-white/10" />
              </motion.div>
            </div>

            {/* Floating album cards */}
            <FloatingAlbumCard
              title="Midnight Drive"
              artist="Neon Pulse"
              gradient="linear-gradient(135deg, #7c3aed, #4f46e5)"
              delay={0}
              floatY={[0, -16, 0]}
              style={{ top: '5%', left: '-8%' }}
            />
            <FloatingAlbumCard
              title="Solar Waves"
              artist="Aether"
              gradient="linear-gradient(135deg, #06b6d4, #0284c7)"
              delay={1.5}
              floatY={[0, -12, 0]}
              style={{ top: '15%', right: '-5%' }}
            />
            <FloatingAlbumCard
              title="Echoes"
              artist="Luna Ray"
              gradient="linear-gradient(135deg, #f472b6, #ec4899)"
              delay={0.8}
              floatY={[0, -14, 0]}
              style={{ bottom: '18%', left: '-5%' }}
            />
            <FloatingAlbumCard
              title="Deep Space"
              artist="Cosmo"
              gradient="linear-gradient(135deg, #34d399, #059669)"
              delay={2}
              floatY={[0, -10, 0]}
              style={{ bottom: '5%', right: '-2%' }}
            />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <p className="text-white/20 text-xs uppercase tracking-widest">Scroll</p>
          <motion.div
            className="w-[1px] h-8 bg-gradient-to-b from-white/20 to-transparent"
            animate={{ scaleY: [1, 0.3, 1], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/20 via-transparent to-cyan-950/20 pointer-events-none" />
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), rgba(6,182,212,0.4), transparent)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), rgba(6,182,212,0.4), transparent)',
          }}
        />
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { value: 50_000_000, suffix: '+', label: 'Tracks' },
            { value: 10_000_000, suffix: '+', label: 'Artists' },
            { value: 150_000_000, suffix: '', label: 'Users' },
          ].map(({ value, suffix, label }) => (
            <div key={label}>
              <p
                className="text-4xl sm:text-5xl font-black mb-1"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                <AnimatedNumber target={value} suffix={suffix} />
              </p>
              <p className="text-white/40 text-sm uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-28 px-6 max-w-7xl mx-auto">
        <FeaturesHeading />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Zap className="w-5 h-5 text-white" />}
            title="High Fidelity Audio"
            description="Stream lossless FLAC and hi-res audio up to 24-bit/192kHz. Feel every nuance the artist intended."
            gradient="linear-gradient(135deg, #7c3aed, #5b21b6)"
            delay={0}
          />
          <FeatureCard
            icon={<Compass className="w-5 h-5 text-white" />}
            title="Smart Discovery"
            description="Our AI learns your taste over time — surfacing new artists, hidden gems and daily mixes tailored just for you."
            gradient="linear-gradient(135deg, #06b6d4, #0284c7)"
            delay={0.15}
          />
          <FeatureCard
            icon={<Library className="w-5 h-5 text-white" />}
            title="Unlimited Library"
            description="50 million tracks, 10 million artists. Download for offline listening with no streaming limits."
            gradient="linear-gradient(135deg, #f472b6, #ec4899)"
            delay={0.3}
          />
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 pb-28 max-w-4xl mx-auto">
        <CTABanner />
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-black tracking-[0.2em] text-gradient">AURA</span>
          <p className="text-white/20 text-xs text-center">
            &copy; {new Date().getFullYear()} AURA Music. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white/60 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white/60 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
