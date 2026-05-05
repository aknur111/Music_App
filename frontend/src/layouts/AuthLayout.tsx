import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Outlet } from 'react-router-dom';

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  opacity: number;
}

const PARTICLE_COUNT = 40;

function createParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 2 + 0.5,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    opacity: Math.random() * 0.4 + 0.1,
  };
}

const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(canvas.width, canvas.height)
      );
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${p.opacity})`;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
    />
  );
};

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#06060e]">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.25) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(6,182,212,0.15) 0%, transparent 50%), #06060e',
            'radial-gradient(ellipse at 60% 20%, rgba(124,58,237,0.2) 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(6,182,212,0.18) 0%, transparent 50%), #06060e',
            'radial-gradient(ellipse at 40% 80%, rgba(124,58,237,0.22) 0%, transparent 60%), radial-gradient(ellipse at 70% 40%, rgba(6,182,212,0.12) 0%, transparent 50%), #06060e',
            'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.25) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(6,182,212,0.15) 0%, transparent 50%), #06060e',
          ],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />

      {/* Particle canvas */}
      <ParticleCanvas />

      {/* Large blurred orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500/8 blur-3xl pointer-events-none" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Animated border card wrapper */}
        <div className="relative rounded-2xl p-px overflow-hidden">
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0%, rgba(124,58,237,0.5) 25%, rgba(6,182,212,0.4) 50%, rgba(244,114,182,0.3) 75%, transparent 100%)',
            }}
          />
          <div className="relative rounded-2xl bg-[#0d0d1a]/95 backdrop-blur-2xl p-8 shadow-2xl shadow-black/60">
            {/* AURA logo */}
            <div className="flex flex-col items-center mb-8">
              <motion.div
                className="relative"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-xl shadow-violet-900/60 mb-3 mx-auto">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    className="block w-6 h-6 rounded-full border-[2.5px] border-white/90 border-t-transparent"
                  />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-violet-500/30 blur-lg -z-10 scale-125"
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <h1 className="text-3xl font-black tracking-[0.2em] bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                AURA
              </h1>
              <p className="text-xs text-white/30 mt-1 tracking-widest uppercase">
                Your music universe
              </p>
            </div>

            {/* Route content (Login / Register forms) */}
            <Outlet />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
