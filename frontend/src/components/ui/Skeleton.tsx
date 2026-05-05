import React from 'react';
import { clsx } from 'clsx';

type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number; // for text variant
}

const shimmerStyle: React.CSSProperties = {
  background:
    'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 2.5s linear infinite',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  className,
  lines = 3,
}) => {
  const sizeStyle: React.CSSProperties = {
    width: width ?? undefined,
    height: height ?? undefined,
  };

  if (variant === 'text') {
    return (
      <div className={clsx('flex flex-col gap-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            style={{ ...shimmerStyle, width: i === lines - 1 ? '60%' : '100%' }}
            className="h-3.5 rounded-full"
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div
        style={{ ...shimmerStyle, ...sizeStyle }}
        className={clsx('rounded-full', className)}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={clsx(
          'rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col gap-3',
          className
        )}
      >
        <div
          style={shimmerStyle}
          className="w-full aspect-square rounded-xl"
        />
        <div
          style={{ ...shimmerStyle, width: '75%' }}
          className="h-4 rounded-full"
        />
        <div
          style={{ ...shimmerStyle, width: '50%' }}
          className="h-3 rounded-full"
        />
      </div>
    );
  }

  // rect (default)
  return (
    <div
      style={{ ...shimmerStyle, ...sizeStyle }}
      className={clsx('rounded-xl', className)}
    />
  );
};
