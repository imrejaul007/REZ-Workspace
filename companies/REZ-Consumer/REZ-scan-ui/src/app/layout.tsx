import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'REZ Scan',
  description: 'Scan QR codes and discover merchants with REZ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'REZ Scan',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6366F1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <div className="flex flex-col min-h-screen">
          <header className="bg-white border-b border-gray-100 safe-area-top">
            <div className="px-4 py-3">
              <h1 className="text-lg font-semibold text-gray-900">REZ Scan</h1>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <nav className="bg-white border-t border-gray-100 safe-area-bottom">
            <div className="flex justify-around py-2">
              <a href="/" className="flex flex-col items-center px-4 py-2 text-rez-primary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span className="text-xs mt-1">Scan</span>
              </a>
              <a href="/history" className="flex flex-col items-center px-4 py-2 text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs mt-1">History</span>
              </a>
            </div>
          </nav>
        </div>
      </body>
    </html>
  )
}
