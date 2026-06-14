import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'NexTaBizz - Universal Business OS',
  description: 'Manage your restaurant, hotel, salon, retail, or any business with NexTaBizz. The all-in-one business management platform.',
  keywords: ['business management', 'POS', 'restaurant software', 'hotel management', 'salon software', 'retail POS'],
  authors: [{ name: 'REZ-Merchant' }],
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
