import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hotel Staff Dashboard',
  description: 'Staff Web Dashboard for hotel operations - Front desk, Housekeeping, Kitchen, Manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
