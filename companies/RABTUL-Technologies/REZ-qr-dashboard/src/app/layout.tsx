import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'REZ QR Unified Dashboard',
  description: 'Cross-company QR analytics and management',
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
