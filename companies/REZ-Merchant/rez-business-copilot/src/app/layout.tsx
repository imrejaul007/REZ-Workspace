import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'REZ Business Copilot',
  description: 'Natural Language Business Q&A Interface for Merchants',
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