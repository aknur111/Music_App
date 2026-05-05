import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx, resolving conflicts intelligently.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format a duration in seconds to mm:ss or h:mm:ss.
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/**
 * Format a large number with compact notation (e.g. 1.2M, 42K).
 */
export function formatCount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/**
 * Extract up to 2 uppercase initials from a display name.
 */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Truncate a string to a maximum length, appending an ellipsis if trimmed.
 */
export function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return `${str.slice(0, len).trimEnd()}…`
}

/**
 * Return one of several pre-defined AURA gradient class strings at random.
 * Useful for placeholder / skeleton cover art.
 */
export function randomGradient(): string {
  const gradients = [
    'from-violet-600 to-cyan-500',
    'from-violet-700 to-pink-400',
    'from-cyan-500 to-violet-600',
    'from-pink-400 to-violet-700',
    'from-violet-500 to-indigo-600',
    'from-cyan-400 to-blue-600',
    'from-fuchsia-600 to-violet-600',
    'from-indigo-500 to-cyan-500',
  ]
  return gradients[Math.floor(Math.random() * gradients.length)]
}

/**
 * Format a byte count to a human-readable string (KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Sleep for a given number of milliseconds (useful in async flows).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
