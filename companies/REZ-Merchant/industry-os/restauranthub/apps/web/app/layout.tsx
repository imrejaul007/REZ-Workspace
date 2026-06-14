import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'RestoPapa — Run Your Restaurant, Your Way',
    template: '%s | RestoPapa',
  },
  description: 'Comprehensive B2B/B2C SaaS platform for restaurants with hiring, marketplace, job portal, and community features.',
  keywords: [
    'restaurant management',
    'hiring platform',
    'marketplace',
    'job portal',
    'restaurant community',
    'employee verification',
    'vendor management',
  ],
  authors: [{ name: 'RestoPapa Team' }],
  creator: 'RestoPapa',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'RestoPapa — Run Your Restaurant, Your Way',
    description: 'Comprehensive B2B/B2C SaaS platform for restaurants with hiring, marketplace, job portal, and community features.',
    siteName: 'RestoPapa',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'RestoPapa Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RestoPapa — Run Your Restaurant, Your Way',
    description: 'Comprehensive B2B/B2C SaaS platform for restaurants with hiring, marketplace, job portal, and community features.',
    images: ['/og-image.jpg'],
    creator: '@restopapa',
  },
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
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon', type: 'image/png' },
    ],
    apple: [
      { url: '/icon', type: 'image/png' },
    ],
  },
  other: {
    'msapplication-TileColor': '#ef4444',
    'theme-color': '#ffffff',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen bg-background font-sans antialiased">
            {children}
          </div>
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}