import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { notifications } from '@/lib/mock-data';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CorpPerks Admin Dashboard',
  description: 'Unified HR administration platform for CorpPerks',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-50">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header notifications={notifications} />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
