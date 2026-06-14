import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REZ Pharmacy Admin - Health Management",
  description: "Pharmacy & Healthcare Business Management Portal",
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