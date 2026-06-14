import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'

export const metadata: Metadata = {
  title: 'ReZ Menu | AI-Powered Restaurant Ordering',
  description: 'Discover delicious food with personalized recommendations and earn rewards on every order',
  keywords: ['menu', 'restaurant', 'food', 'order', 'delivery', 'ai', 'personalized'],
  authors: [{ name: 'ReZ Platform' }],
  openGraph: {
    title: 'ReZ Menu | AI-Powered Restaurant Ordering',
    description: 'Discover delicious food with personalized recommendations',
    type: 'website',
    siteName: 'ReZ Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReZ Menu',
    description: 'AI-powered restaurant ordering',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gray-50 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
