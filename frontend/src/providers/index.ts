import { auraProvider } from './aura'

export type { MusicProvider } from './types'

export function getProvider(): import('./types').MusicProvider {
  return auraProvider
}