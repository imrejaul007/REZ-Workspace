import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import MainLayout from '../components/layout/MainLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Insight Campus - Student Infrastructure Platform',
  description: 'Your complete student hub for campus life, career, and community',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}
