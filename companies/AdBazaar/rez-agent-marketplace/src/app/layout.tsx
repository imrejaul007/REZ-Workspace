import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReZ Agent Marketplace - AI Agents for Every Business',
  description: 'Discover and install AI agents for restaurants, hotels, healthcare, retail, and more. Transform your business operations with intelligent automation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}