import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Professional Twin Dashboard',
  description: 'Your AI Workforce - Employee-Owned Professional Twins',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
