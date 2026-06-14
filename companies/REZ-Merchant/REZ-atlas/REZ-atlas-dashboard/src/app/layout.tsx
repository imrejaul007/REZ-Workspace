import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'REZ Atlas Dashboard',
  description: 'The Merchant Intelligence Network for the Physical World',
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