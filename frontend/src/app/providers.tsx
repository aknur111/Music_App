import { type ReactNode, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

interface ProvidersProps {
  children: ReactNode
}


export function Providers({ children }: ProvidersProps) {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return <>{children}</>
}
