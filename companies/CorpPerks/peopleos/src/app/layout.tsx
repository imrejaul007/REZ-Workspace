import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import MainLayout from '../components/layout/MainLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'PeopleOS - Workforce Operating System',
  description: 'AI-powered workforce management platform',
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
