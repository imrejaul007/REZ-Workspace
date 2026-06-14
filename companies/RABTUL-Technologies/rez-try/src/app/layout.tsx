import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ReZ Try - Discover and Book Trials',
  description: 'Trial discovery + booking platform where users can discover and book trials at local businesses.',
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
