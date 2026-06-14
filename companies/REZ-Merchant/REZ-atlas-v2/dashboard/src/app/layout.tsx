import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'REZ Atlas v2 - Revenue Intelligence Platform',
  description: 'AI-powered sales intelligence and automation platform',
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
