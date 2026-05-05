import React, { useEffect, useRef, useCallback } from 'react';
import { clsx } from 'clsx';

interface AudioWaveformProps {
  playing: boolean;
  variant?: 'small' | 'large';
  color?: string;
  barCount?: number;
  className?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  playing,
  variant = 'small',
  color = '#8b5cf6',
  barCount,
  className,
}) => {
  const count = barCount ?? (variant === 'small' ? 4 : 32);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const heightsRef = useRef<number[]>(Array.from({ length: count }, () => Math.random()));
  const targetHeightsRef = useRef<number[]>(Array.from({ length: count }, () => Math.random()));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const barWidth = variant === 'small' ? 3 : Math.max(2, width / count - 2);
    const gap = variant === 'small' ? 2 : Math.max(1, width / count * 0.25);
    const totalWidth = count * (barWidth + gap) - gap;
    const startX = (width - totalWidth) / 2;

    for (let i = 0; i < count; i++) {
      const h = heightsRef.current[i];
      const barH = Math.max(2, h * height);
      const x = startX + i * (barWidth + gap);
      const y = (height - barH) / 2;

      // Gradient for each bar
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '66');
      ctx.fillStyle = grad;
      const r = Math.min(barWidth / 2, barH / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barWidth - r, y);
      ctx.arcTo(x + barWidth, y, x + barWidth, y + r, r);
      ctx.lineTo(x + barWidth, y + barH - r);
      ctx.arcTo(x + barWidth, y + barH, x + barWidth - r, y + barH, r);
      ctx.lineTo(x + r, y + barH);
      ctx.arcTo(x, y + barH, x, y + barH - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      ctx.fill();
    }
  }, [count, variant, color]);

  const animate = useCallback(() => {
    for (let i = 0; i < count; i++) {
      // Lerp toward target
      heightsRef.current[i] += (targetHeightsRef.current[i] - heightsRef.current[i]) * 0.12;

      // Periodically set a new target
      if (Math.random() < 0.05) {
        targetHeightsRef.current[i] = 0.15 + Math.random() * 0.85;
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(animate);
  }, [count, draw]);

  const drawStatic = useCallback(() => {
    // Draw low, uniform bars when stopped
    for (let i = 0; i < count; i++) {
      heightsRef.current[i] += (0.15 - heightsRef.current[i]) * 0.12;
    }
    draw();
  }, [count, draw]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);

    if (playing) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      // Animate to resting state
      let frames = 0;
      const settle = () => {
        drawStatic();
        frames++;
        if (frames < 30) {
          rafRef.current = requestAnimationFrame(settle);
        }
      };
      rafRef.current = requestAnimationFrame(settle);
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, animate, drawStatic]);

  const canvasWidth = variant === 'small' ? count * 5 : 280;
  const canvasHeight = variant === 'small' ? 18 : 80;

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className={clsx('block', className)}
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
};
