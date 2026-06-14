import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REZ Spa Admin - Wellness Management",
  description: "Spa & Wellness Business Management Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}