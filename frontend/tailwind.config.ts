import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          bg:       '#06060e',
          surface:  '#0d0d1a',
          elevated: '#13131f',
          border:   'rgba(255,255,255,0.08)',
        },
        primary: {
          DEFAULT: '#7c3aed',
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        accent: {
          DEFAULT: '#06b6d4',
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        warm: {
          DEFAULT: '#f472b6',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'aura-gradient': 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 50%, #f472b6 100%)',
        'aura-gradient-soft': 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.2) 50%, rgba(244,114,182,0.2) 100%)',
      },
      animation: {
        'float':          'float 6s ease-in-out infinite',
        'glow-pulse':     'glow-pulse 2s ease-in-out infinite',
        'shimmer':        'shimmer 2.5s linear infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'waveform':       'waveform 1.2s ease-in-out infinite',
        'spin-slow':      'spin 8s linear infinite',
        'fade-in':        'fade-in 0.4s ease-out',
        'slide-up':       'slide-up 0.4s ease-out',
        'slide-down':     'slide-down 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.1)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(124,58,237,0.8), 0 0 80px rgba(124,58,237,0.3)',
          },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        waveform: {
          '0%, 100%': { scaleY: 0.4 },
          '50%':      { scaleY: 1.0 },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        glow:        '0 0 20px rgba(124,58,237,0.4)',
        'glow-lg':   '0 0 40px rgba(124,58,237,0.6)',
        'glow-cyan': '0 0 20px rgba(6,182,212,0.4)',
        'glow-pink': '0 0 20px rgba(244,114,182,0.4)',
        glass:       '0 8px 32px rgba(0,0,0,0.4)',
        'glass-lg':  '0 16px 64px rgba(0,0,0,0.6)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}

export default config
