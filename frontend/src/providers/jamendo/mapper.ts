import type { Track, Album, Artist } from '@/types'
import type { JamendoTrack, JamendoAlbum, JamendoArtist } from './types'

function seeded(id: string, min: number, max: number): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) >>> 0
  return min + (h % (max - min + 1))
}

function parseYear(dateStr: string): number {
  const year = parseInt(dateStr?.slice(0, 4) ?? '', 10)
  return Number.isNaN(year) || year === 0 ? new Date().getFullYear() : year
}

function parseDate(dateStr: string): string {
  if (!dateStr || dateStr.startsWith('0000')) return new Date().toISOString()
  return `${dateStr}T00:00:00Z`
}

export function toTrack(t: JamendoTrack): Track {
  return {
    id: `jmd-t-${t.id}`,
    title: t.name,
    artist: t.artist_name,
    artistId: `jmd-a-${t.artist_id}`,
    album: t.album_name,
    albumId: `jmd-al-${t.album_id}`,
    duration: t.duration,
    coverUrl: t.image,
    audioUrl: t.audio,
    genre: t.musicinfo?.tags?.genres?.[0] ?? 'Unknown',
    playCount: 0,
    likeCount: 0,
    isLiked: false,
    createdAt: parseDate(t.releasedate),
    updatedAt: parseDate(t.releasedate),
  }
}

export function toAlbum(a: JamendoAlbum, trackCount = 0): Album {
  const rawId = String(a.id)
  return {
    id: `jmd-al-${a.id}`,
    title: a.name,
    artistId: `jmd-a-${a.artist_id}`,
    artist: a.artist_name,
    coverUrl: a.image,
    releaseYear: parseYear(a.releasedate),
    genre: a.musicinfo?.tags?.genres?.[0] ?? 'Unknown',
    trackCount: trackCount > 0 ? trackCount : seeded(rawId, 5, 16),
    createdAt: parseDate(a.releasedate),
  }
}

export function toArtist(a: JamendoArtist): Artist {
  const rawId = String(a.id)
  return {
    id: `jmd-a-${a.id}`,
    name: a.name,
    bio: undefined,
    avatarUrl: a.image,
    coverUrl: a.image,
    genre: a.musicinfo?.tags?.genres?.[0] ?? 'Unknown',
    followerCount: seeded(rawId, 500, 250000),
    albumCount: seeded(rawId + 'al', 1, 12),
    trackCount: seeded(rawId + 'tr', 8, 80),
    isFollowed: false,
    createdAt: parseDate(a.joindate),
  }
}
