import { lazy, Suspense, type ReactNode } from 'react'
import {
  createBrowserRouter,
  Navigate,
  useLocation,
} from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'


import { MainLayout }  from '@/layouts/MainLayout'
import { AdminLayout } from '@/layouts/AdminLayout'


const LandingPage        = lazy(() => import('@/pages/LandingPage'))
const LoginPage          = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage       = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage  = lazy(() => import('@/pages/auth/ResetPasswordPage'))


const HomePage         = lazy(() => import('@/pages/app/HomePage'))
const TracksPage       = lazy(() => import('@/pages/main/TracksPage'))
const ArtistsPage      = lazy(() => import('@/pages/app/ArtistsPage'))
const AlbumsPage       = lazy(() => import('@/pages/app/AlbumsPage'))
const AlbumDetailPage  = lazy(() => import('@/pages/app/AlbumDetailPage'))
const PlaylistDetail   = lazy(() => import('@/pages/app/PlaylistDetailPage'))
const LibraryPage      = lazy(() => import('@/pages/app/LibraryPage'))
const FavoritesPage    = lazy(() => import('@/pages/app/FavoritesPage'))
const ProfilePage          = lazy(() => import('@/pages/app/ProfilePage'))
const DiscoverMoodsPage    = lazy(() => import('@/pages/app/DiscoverMoodsPage'))
const MoodDetailPage       = lazy(() => import('@/pages/app/MoodDetailPage'))
const WavePage             = lazy(() => import('@/pages/app/WavePage'))


const AdminOverviewPage  = lazy(() => import('@/pages/admin/AdminOverviewPage'))
const UserAnalyticsPage  = lazy(() => import('@/pages/admin/UserAnalyticsPage'))
const TrackAnalyticsPage = lazy(() => import('@/pages/admin/TrackAnalyticsPage'))
const ServiceHealthPage  = lazy(() => import('@/pages/admin/ServiceHealthPage'))
const SystemMetricsPage  = lazy(() => import('@/pages/admin/SystemMetricsPage'))


function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}


function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}


function AdminRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  if (!isAdmin) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}


export const router = createBrowserRouter([
  {
    path: '/',
    element: <PageSuspense><LandingPage /></PageSuspense>,
  },
  {
    path: '/login',
    element: <PageSuspense><LoginPage /></PageSuspense>,
  },
  {
    path: '/register',
    element: <PageSuspense><RegisterPage /></PageSuspense>,
  },
  {
    path: '/forgot-password',
    element: <PageSuspense><ForgotPasswordPage /></PageSuspense>,
  },
  {
    path: '/reset-password',
    element: <PageSuspense><ResetPasswordPage /></PageSuspense>,
  },

  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/home',
        element: <PageSuspense><HomePage /></PageSuspense>,
      },
      {
        path: '/tracks',
        element: <PageSuspense><TracksPage /></PageSuspense>,
      },
      {
        path: '/discover',
        element: <PageSuspense><TracksPage /></PageSuspense>,
      },
      {
        path: '/discover/moods',
        element: <PageSuspense><DiscoverMoodsPage /></PageSuspense>,
      },
      {
        path: '/discover/moods/:mood',
        element: <PageSuspense><MoodDetailPage /></PageSuspense>,
      },
      {
        path: '/artists',
        element: <PageSuspense><ArtistsPage /></PageSuspense>,
      },
      {
        path: '/albums',
        element: <PageSuspense><AlbumsPage /></PageSuspense>,
      },
      {
        path: '/albums/:id',
        element: <PageSuspense><AlbumDetailPage /></PageSuspense>,
      },
      {
        path: '/playlists/:id',
        element: <PageSuspense><PlaylistDetail /></PageSuspense>,
      },
      {
        path: '/library',
        element: <PageSuspense><LibraryPage /></PageSuspense>,
      },
      {
        path: '/favorites',
        element: <PageSuspense><FavoritesPage /></PageSuspense>,
      },
      {
        path: '/profile',
        element: <PageSuspense><ProfilePage /></PageSuspense>,
      },
      {
        path: '/wave',
        element: <PageSuspense><WavePage /></PageSuspense>,
      },
    ],
  },

  {
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      {
        path: '/admin',
        element: <PageSuspense><AdminOverviewPage /></PageSuspense>,
      },
      {
        path: '/admin/users',
        element: <PageSuspense><UserAnalyticsPage /></PageSuspense>,
      },
      {
        path: '/admin/tracks',
        element: <PageSuspense><TrackAnalyticsPage /></PageSuspense>,
      },
      {
        path: '/admin/health',
        element: <PageSuspense><ServiceHealthPage /></PageSuspense>,
      },
      {
        path: '/admin/metrics',
        element: <PageSuspense><SystemMetricsPage /></PageSuspense>,
      },
    ],
  },

  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
])
