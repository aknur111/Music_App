import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-20 px-6 text-center relative ${className ?? ''}`}>
      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-white/[0.04]"
            style={{ width: 120 + i * 80, height: 120 + i * 80 }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative mb-5"
      >
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/[0.08] flex items-center justify-center">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon className="w-9 h-9 text-white/30" strokeWidth={1.5} />
          </motion.div>
        </div>
        {/* Glow under icon */}
        <div className="absolute inset-0 rounded-2xl bg-violet-500/10 blur-xl -z-10" />
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-2 max-w-sm"
      >
        <h3 className="text-base font-semibold text-white/70">{title}</h3>
        {description && (
          <p className="text-sm text-white/40 leading-relaxed">{description}</p>
        )}
      </motion.div>

      {/* Action */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Button variant="secondary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        </motion.div>
      )}
    </div>
  );
};
