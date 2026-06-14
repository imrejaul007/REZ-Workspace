import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CorpPerks Super Admin',
  description: 'Multi-tenant management platform for CorpPerks',
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
