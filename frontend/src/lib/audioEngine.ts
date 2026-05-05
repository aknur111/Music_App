let audio: HTMLAudioElement | null = null

export function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio()
    audio.preload = 'metadata'
  }
  return audio
}
