import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReZ Workflow Editor - Visual Automation Platform',
  description: 'Build powerful automation workflows with a drag-and-drop visual editor',
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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-950 antialiased">
        {children}
      </body>
    </html>
  );
}