import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'REZ Revenue OS - B2B Sales Dashboard',
  description: 'Unified B2B sales intelligence dashboard',
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
