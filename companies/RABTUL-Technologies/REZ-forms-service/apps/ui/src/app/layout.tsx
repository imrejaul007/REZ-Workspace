import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'REZ Forms - AI-Powered Form Builder',
  description: 'Build forms with natural language. Auto-create leads. Trigger Genie AI agents.',
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