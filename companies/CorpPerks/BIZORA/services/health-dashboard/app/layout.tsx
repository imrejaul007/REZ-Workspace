import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BIZORA Health Dashboard',
  description: 'System health monitoring dashboard for BIZORA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 min-h-screen">
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
