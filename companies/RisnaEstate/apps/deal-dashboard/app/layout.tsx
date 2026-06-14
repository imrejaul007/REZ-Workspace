import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryProvider } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RisnaEstate - Deal Pipeline Dashboard',
  description: 'Real estate deal pipeline management dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <QueryProvider>
          <TooltipProvider>
            <Sidebar />
            <div className="min-h-screen">
              {children}
            </div>
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
