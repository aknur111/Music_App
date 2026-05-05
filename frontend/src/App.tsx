import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { router } from '@/app/router'
import { Providers } from '@/app/providers'

function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#13131f',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
          success: {
            iconTheme: {
              primary: '#7c3aed',
              secondary: '#f8fafc',
            },
          },
          error: {
            iconTheme: {
              primary: '#f472b6',
              secondary: '#f8fafc',
            },
          },
        }}
      />
    </Providers>
  )
}

export default App
