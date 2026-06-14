import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REZ Fleet Admin",
  description: "Fleet Management Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}