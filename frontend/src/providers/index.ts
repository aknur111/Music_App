import { auraProvider } from './aura'
import type { MusicProvider } from './types'

export type { MusicProvider } from './types'

// Everything from our backend (iTunes-imported data with real covers)
// Jamendo removed — our DB already has iTunes artwork for tracks and albums
export function getProvider(): MusicProvider {
  return auraProvider
}
