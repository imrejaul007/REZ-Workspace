import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AdBazaar Dashboard',
  description: 'Unified dashboard for AdBazaar platform',
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
