import type { JamendoResponse, JamendoTrack, JamendoAlbum, JamendoArtist } from './types'

const BASE = 'https://api.jamendo.com/v3.0'
const TIMEOUT_MS = 8000

function clientId(): string {
  const id = import.meta.env.VITE_JAMENDO_CLIENT_ID
  if (!id) throw new Error('VITE_JAMENDO_CLIENT_ID is not set')
  return id
}

async function request<T>(
  path: string,
  params: Record<string, string | number> = {},
): Promise<T[]> {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('client_id', clientId())
  url.searchParams.set('format', 'json')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url.toString(), { signal: controller.signal })
    if (!res.ok) throw new Error(`Jamendo ${path} → HTTP ${res.status}`)
    const json: JamendoResponse<T> = await res.json()
    if (json.headers.status !== 'success') {
      throw new Error(`Jamendo error: ${json.headers.error_message}`)
    }
    return json.results
  } finally {
    clearTimeout(timer)
  }
}

export function fetchTracks(params: {
  limit?: number
  offset?: number
  search?: string
} = {}): Promise<JamendoTrack[]> {
  return request<JamendoTrack>('/tracks/', {
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    audioformat: 'mp32',
    include: 'musicinfo',
    boost: 'popularity_total',
    ...(params.search ? { namesearch: params.search } : {}),
  })
}

export async function fetchTrack(id: string): Promise<JamendoTrack | null> {
  const results = await request<JamendoTrack>('/tracks/', {
    id,
    audioformat: 'mp32',
    include: 'musicinfo',
  })
  return results[0] ?? null
}

export function fetchAlbums(params: { limit?: number } = {}): Promise<JamendoAlbum[]> {
  return request<JamendoAlbum>('/albums/', {
    limit: params.limit ?? 20,
    include: 'musicinfo',
    boost: 'popularity_total',
  })
}

export async function fetchAlbum(id: string): Promise<JamendoAlbum | null> {
  const results = await request<JamendoAlbum>('/albums/', {
    id,
    include: 'musicinfo',
  })
  return results[0] ?? null
}

export function fetchAlbumTracks(albumId: string): Promise<JamendoTrack[]> {
  return request<JamendoTrack>('/tracks/', {
    album_id: albumId,
    audioformat: 'mp32',
    include: 'musicinfo',
    limit: 50,
  })
}

export function fetchArtists(params: { limit?: number } = {}): Promise<JamendoArtist[]> {
  return request<JamendoArtist>('/artists/', {
    limit: params.limit ?? 20,
    include: 'musicinfo',
    boost: 'popularity_total',
  })
}

export async function fetchArtist(id: string): Promise<JamendoArtist | null> {
  const results = await request<JamendoArtist>('/artists/', {
    id,
    include: 'musicinfo',
  })
  return results[0] ?? null
}
