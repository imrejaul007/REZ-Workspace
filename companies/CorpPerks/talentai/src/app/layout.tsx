import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import Layout from '../components/Layout';
import './globals.css';

export const metadata: Metadata = {
  title: 'TalentAI - AI Career Intelligence',
  description: 'Find jobs that actually fit you with AI-powered matching',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <Layout>{children}</Layout>
    </Providers>
  );
}
