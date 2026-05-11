import { jamendoProvider } from './jamendo'

export type { MusicProvider } from './types'
export { jamendoProvider }

export function getProvider(): import('./types').MusicProvider {
  return jamendoProvider
}
