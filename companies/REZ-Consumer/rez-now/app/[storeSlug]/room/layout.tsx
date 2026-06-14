/**
 * Room Hub Layout
 *
 * Standalone layout for hotel room hub pages — no store header/nav.
 * Guests access these pages via QR scan, so they shouldn't see the
 * regular REZ Now navigation.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
