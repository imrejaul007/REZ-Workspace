import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Social Automation Dashboard",
  description: "Unified control center for social automation services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
<div className="flex h-screen overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
