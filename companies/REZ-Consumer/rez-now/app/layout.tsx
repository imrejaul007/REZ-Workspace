import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import NetworkStatusBanner from '@/components/ui/NetworkStatusBanner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'REZ Now';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rez-now.onrender.com';

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: 'Order food, pay at unknown store, earn REZ coins',
  metadataBase: new URL(APP_URL),
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: APP_NAME },
  openGraph: { type: 'website', siteName: APP_NAME },
};

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50 text-gray-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <Providers>{children}</Providers>
        <NetworkStatusBanner />
        <Script
          id="register-sw"
          strategy="afterInteractive"
        >{`if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(() => {}); }`}</Script>
      </body>
    </html>
  );
}
