import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconClick,
      containerClassName,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-white/70 tracking-wide"
          >
            {label}
          </label>
        )}

        <div className="relative group">
          {/* Animated focus border */}
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            animate={{
              boxShadow: isFocused
                ? error
                  ? '0 0 0 2px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.1)'
                  : '0 0 0 2px rgba(124, 58, 237, 0.5), 0 0 20px rgba(124, 58, 237, 0.15)'
                : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
            transition={{ duration: 0.2 }}
          />

          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-violet-400 transition-colors duration-200 pointer-events-none w-4 h-4 flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={clsx(
              'w-full bg-white/5 backdrop-blur-xl text-white placeholder:text-white/30 rounded-xl py-2.5 text-sm outline-none transition-colors duration-200',
              leftIcon ? 'pl-10' : 'pl-4',
              rightIcon ? 'pr-10' : 'pr-4',
              error ? 'border border-red-500/50' : 'border border-white/[0.08]',
              'hover:bg-white/[0.07]',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors duration-200 w-4 h-4 flex items-center justify-center"
            >
              {rightIcon}
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-red-400 font-medium"
            >
              {error}
            </motion.p>
          )}
          {!error && helperText && (
            <motion.p
              key="helper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-white/40"
            >
              {helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';
