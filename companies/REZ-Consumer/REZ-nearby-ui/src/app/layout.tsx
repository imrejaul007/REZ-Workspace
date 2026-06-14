import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'REZ Nearby',
  description: 'Find nearby stores and services',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
