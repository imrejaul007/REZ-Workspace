import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import OrganizationSchema from '@/components/OrganizationSchema'
import WebSiteSchema from '@/components/WebSiteSchema'

const inter = Inter({ subsets: ['latin'] })

// CRITICAL SEO FIX: Enhanced metadata with proper Open Graph, Twitter cards, and robots
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://adbazaar.com'),
  title: {
    default: "AdBazaar — India's Ad Space Marketplace",
    template: '%s | AdBazaar',
  },
  description:
    "India's closed-loop ad marketplace. Find, book, and track billboard and retail ad spaces with QR attribution via REZ.",
  keywords: [
    'advertising',
    'outdoor ads',
    'OOH',
    'billboard',
    'influencer marketing',
    'India ad marketplace',
    'QR advertising',
    'DOOH',
    'digital signage',
  ],
  authors: [{ name: 'REZ', url: 'https://rez.money' }],
  creator: 'REZ',
  publisher: 'REZ',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    alternateLocale: ['en'],
    url: 'https://adbazaar.com',
    siteName: 'AdBazaar',
    title: "AdBazaar — India's Ad Space Marketplace",
    description:
      "India's closed-loop ad marketplace. Find, book, and track billboard and retail ad spaces with QR attribution via REZ.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AdBazaar - India Ad Space Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "AdBazaar — India's Ad Space Marketplace",
    description:
      "India's closed-loop ad marketplace. Find, book, and track billboard and retail ad spaces with QR attribution via REZ.",
    images: ['/og-image.png'],
    creator: '@rezmoney',
  },
  alternates: {
    canonical: 'https://adbazaar.com',
    languages: {
      'en-IN': 'https://adbazaar.com',
    },
  },
  category: 'Advertising',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* CRITICAL SEO FIX: Organization structured data for rich search results */}
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body className={inter.className} style={{ backgroundColor: '#0f0f0f', color: '#ffffff', margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
