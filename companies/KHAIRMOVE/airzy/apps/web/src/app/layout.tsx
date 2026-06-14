import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Airzy - Smart companion for frequent travelers',
  description: 'Premium airport lifestyle ecosystem - flights, lounges, hotels, and rewards',
  manifest: '/manifest.json',
  themeColor: '#6366F1',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
