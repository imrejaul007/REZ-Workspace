import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/Sidebar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReZ Service Portal',
  description: 'Service Management Portal for REZ Ecosystem',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%2322c55e" rx="20" width="100" height="100"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="60" font-weight="bold" fill="white">R</text></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-slate-900">
          <Sidebar />
          <main className="ml-64 flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
