import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'RestaurantHub - Restaurant Industry SaaS Platform',
  description: 'Comprehensive platform for restaurant management, employee verification, job portal, and vendor marketplace',
  keywords: 'restaurant, management, employees, jobs, vendors, saas, platform',
  authors: [{ name: 'RestaurantHub Team' }],
  creator: 'RestaurantHub',
  publisher: 'RestaurantHub',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-gray-50">
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}