import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  hoverGlow?: boolean;
  glowColor?: string;
  animatedBorder?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  hoverGlow = false,
  glowColor = 'rgba(124, 58, 237, 0.15)',
  animatedBorder = false,
  padding = 'lg',
  className,
  ...props
}) => {
  return (
    <motion.div
      initial={false}
      whileHover={
        hoverGlow
          ? {
              boxShadow: `0 0 30px ${glowColor}, 0 8px 32px rgba(0,0,0,0.4)`,
            }
          : undefined
      }
      transition={{ duration: 0.25 }}
      className={clsx(
        'relative backdrop-blur-xl bg-white/5 border border-white/[0.08] rounded-2xl',
        animatedBorder && 'before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-br before:from-violet-500/20 before:via-transparent before:to-cyan-500/20 before:-z-10',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {animatedBorder && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0%, rgba(124,58,237,0.3) 30%, rgba(6,182,212,0.3) 50%, transparent 70%)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-[1px] rounded-2xl bg-[#0d0d1a]" />
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
