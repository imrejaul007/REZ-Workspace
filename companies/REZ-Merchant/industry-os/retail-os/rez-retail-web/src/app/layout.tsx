import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'REZ Retail - Admin Dashboard',
  description: 'Retail management dashboard for products, inventory, and customers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
