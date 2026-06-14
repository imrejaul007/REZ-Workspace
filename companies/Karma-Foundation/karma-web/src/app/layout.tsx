import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'ReZ Karma - Do Good. Earn More.',
  description: 'Earn karma points by volunteering at events. Convert karma to ReZ Coins and unlock rewards.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍃</text></svg>" />
      </head>
      <body className="min-h-full flex flex-col bg-background">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'var(--card)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            },
          }}
        />
      </body>
    </html>
  );
}
