import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'REZ Developer Portal',
  description: 'Build powerful applications with the REZ API ecosystem',
  keywords: ['API', 'Developer', 'Documentation', 'REZ', 'Integration'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 ml-64">
                {children}
              </main>
            </div>
          </div>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1a1a24',
                color: '#fff',
                border: '1px solid #2a2a3a',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
