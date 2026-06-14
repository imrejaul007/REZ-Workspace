import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'REZ Atlas GTM - Autonomous Go-To-Market',
  description: 'AI-powered GTM campaign automation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
