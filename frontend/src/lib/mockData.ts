import type { Playlist } from '@/types'
import type { User } from '@/types/auth'
import { DEMO_TRACKS } from '@/lib/constants'

// ─── Mock Users ───────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    username: 'aknur',
    email: 'aknur@example.com',
    avatarUrl: 'https://picsum.photos/80/80?random=51',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'user-2',
    username: 'nova_beat',
    email: 'nova@example.com',
    avatarUrl: 'https://picsum.photos/80/80?random=52',
    role: 'user',
    createdAt: '2024-02-10T00:00:00Z',
    updatedAt: '2024-05-28T00:00:00Z',
  },
  {
    id: 'user-3',
    username: 'cipherwave',
    email: 'cipher@example.com',
    avatarUrl: 'https://picsum.photos/80/80?random=53',
    role: 'user',
    createdAt: '2024-03-05T00:00:00Z',
    updatedAt: '2024-06-02T00:00:00Z',
  },
  {
    id: 'user-4',
    username: 'stellar_ears',
    email: 'stellar@example.com',
    avatarUrl: 'https://picsum.photos/80/80?random=54',
    role: 'user',
    createdAt: '2024-03-22T00:00:00Z',
    updatedAt: '2024-05-30T00:00:00Z',
  },
  {
    id: 'user-5',
    username: 'deepfreq',
    email: 'deepfreq@example.com',
    avatarUrl: 'https://picsum.photos/80/80?random=55',
    role: 'user',
    createdAt: '2024-04-14T00:00:00Z',
    updatedAt: '2024-06-03T00:00:00Z',
  },
]

// ─── Mock Stats ───────────────────────────────────────────────────────────────

export const MOCK_STATS = {
  adminDashboard: {
    totalUsers: 24_813,
    newUsersThisMonth: 1_402,
    totalTracks: 9_247,
    totalPlays: 48_320_000,
    totalPlaysThisMonth: 3_210_000,
    totalRevenue: 128_450,
    revenueThisMonth: 11_200,
    activeSubscriptions: 18_302,
    storageUsedGb: 412,
    storageCapacityGb: 1000,
    avgSessionMinutes: 34,
    monthlyActiveUsers: 19_877,

    userGrowth: [
      { month: 'Jan', users: 18_200 },
      { month: 'Feb', users: 19_400 },
      { month: 'Mar', users: 20_800 },
      { month: 'Apr', users: 22_100 },
      { month: 'May', users: 23_500 },
      { month: 'Jun', users: 24_813 },
    ],

    playsOverTime: [
      { month: 'Jan', plays: 5_800_000 },
      { month: 'Feb', plays: 6_200_000 },
      { month: 'Mar', plays: 7_100_000 },
      { month: 'Apr', plays: 7_800_000 },
      { month: 'May', plays: 8_200_000 },
      { month: 'Jun', plays: 8_900_000 },
    ],

    topGenres: [
      { genre: 'Electronic', plays: 12_400_000, percentage: 26 },
      { genre: 'Neo-Soul',   plays:  9_800_000, percentage: 20 },
      { genre: 'Indie Rock', plays:  8_300_000, percentage: 17 },
      { genre: 'Ambient',    plays:  5_600_000, percentage: 12 },
      { genre: 'Darkwave',   plays:  4_100_000, percentage:  8 },
      { genre: 'Other',      plays:  8_120_000, percentage: 17 },
    ],

    serviceHealth: {
      apiGateway:    { status: 'healthy',  latencyMs: 12,  uptime: 99.97 },
      authService:   { status: 'healthy',  latencyMs: 8,   uptime: 99.99 },
      trackService:  { status: 'healthy',  latencyMs: 22,  uptime: 99.95 },
      streamService: { status: 'healthy',  latencyMs: 18,  uptime: 99.92 },
      searchService: { status: 'degraded', latencyMs: 180, uptime: 98.40 },
      database:      { status: 'healthy',  latencyMs: 4,   uptime: 99.99 },
    },
  },
}

// ─── Mock Playlists ───────────────────────────────────────────────────────────

export const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-1',
    name: 'Favourites',
    description: 'All-time favourite tracks hand-picked for maximum replay value.',
    coverUrl: 'https://picsum.photos/300/300?random=61',
    trackIds: ['track-1', 'track-3', 'track-7'],
    tracks: [DEMO_TRACKS[0], DEMO_TRACKS[2], DEMO_TRACKS[6]],
    ownerId: 'user-1',
    ownerName: 'aknur',
    isPublic: false,
    followerCount: 0,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-01T18:30:00Z',
  },
  {
    id: 'playlist-2',
    name: 'Late Night Vibes',
    description: 'Smooth tracks for winding down after a long day.',
    coverUrl: 'https://picsum.photos/300/300?random=62',
    trackIds: ['track-5', 'track-6', 'track-8'],
    tracks: [DEMO_TRACKS[4], DEMO_TRACKS[5], DEMO_TRACKS[7]],
    ownerId: 'user-1',
    ownerName: 'aknur',
    isPublic: true,
    followerCount: 340,
    createdAt: '2024-02-20T22:00:00Z',
    updatedAt: '2024-05-28T23:00:00Z',
  },
  {
    id: 'playlist-3',
    name: 'Energy Boost',
    description: 'High-energy tracks to get you moving and in the zone.',
    coverUrl: 'https://picsum.photos/300/300?random=63',
    trackIds: ['track-1', 'track-2', 'track-4', 'track-9'],
    tracks: [DEMO_TRACKS[0], DEMO_TRACKS[1], DEMO_TRACKS[3], DEMO_TRACKS[8]],
    ownerId: 'user-1',
    ownerName: 'aknur',
    isPublic: false,
    followerCount: 0,
    createdAt: '2024-03-10T08:00:00Z',
    updatedAt: '2024-06-02T09:15:00Z',
  },
  {
    id: 'playlist-4',
    name: 'Chill Study',
    description: 'Focus-friendly ambient and dream-pop for deep work sessions.',
    coverUrl: 'https://picsum.photos/300/300?random=64',
    trackIds: ['track-5', 'track-6', 'track-2', 'track-10'],
    tracks: [DEMO_TRACKS[4], DEMO_TRACKS[5], DEMO_TRACKS[1], DEMO_TRACKS[9]],
    ownerId: 'user-1',
    ownerName: 'aknur',
    isPublic: true,
    followerCount: 812,
    createdAt: '2024-04-05T14:00:00Z',
    updatedAt: '2024-05-30T11:00:00Z',
  },
  {
    id: 'playlist-5',
    name: 'Darkwave Descent',
    description: 'Industrial textures and cold synthesizers for the night.',
    coverUrl: 'https://picsum.photos/300/300?random=65',
    trackIds: ['track-11', 'track-12', 'track-4'],
    tracks: [DEMO_TRACKS[10], DEMO_TRACKS[11], DEMO_TRACKS[3]],
    ownerId: 'user-2',
    ownerName: 'nova_beat',
    isPublic: true,
    followerCount: 227,
    createdAt: '2024-05-01T20:00:00Z',
    updatedAt: '2024-05-31T21:00:00Z',
  },
]
