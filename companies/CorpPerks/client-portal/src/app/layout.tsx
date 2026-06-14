import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CorpPerks Client Portal',
  description: 'Access your project portal - view project status, invoices, and communicate with our team',
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
