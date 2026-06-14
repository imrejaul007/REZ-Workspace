import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Verify QR - Product Trust Platform',
  description: 'AI-powered product verification, warranty management, and ownership passports',
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-gray-600 hover:text-emerald-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-emerald-50"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
          {/* Glassmorphism Header */}
          <header className="backdrop-blur-xl bg-white/80 border-b border-gray-200/50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Verify QR
                    </span>
                    <p className="text-xs text-gray-500 -mt-0.5">Product Trust Platform</p>
                  </div>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                  <NavLink href="/">Dashboard</NavLink>
                  <NavLink href="/scan">Scan</NavLink>
                  <NavLink href="/passport">Passport</NavLink>
                  <NavLink href="/claims">Claims</NavLink>
                  <NavLink href="/plans">Plans</NavLink>
                  <NavLink href="/service-centers">Service</NavLink>
                  <NavLink href="/bookings">Bookings</NavLink>
                  <NavLink href="/resale">Resale</NavLink>
                  <NavLink href="/oem">OEM</NavLink>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405a2.032 2.032 0 01-.546-2.186L11 7.414a2.032 2.032 0 01-.546-2.186L9.586 4.86a2.032 2.032 0 012.186-2.186L13 3.586a2.032 2.032 0 012.186 2.186L16.586 7a2.032 2.032 0 012.186 2.186L19 10.414a2.032 2.032 0 01-.546 2.186L17 14.828a2.032 2.032 0 01-2.186.546L14 17" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 3.772 2.341-2.03 4-2 4-1.343 3.772-2 2.21 0 3 1.343 4 3 3.772-2.341 2.03-4 2-2 3.772 2 2.21 0 4-1.343 4-3 3.772-2z" />
                    </svg>
                  </button>
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-emerald-500/30">
                    JD
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-gray-200/50 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-md flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Verify QR</span>
                  <span className="text-xs text-gray-400">v2.0</span>
                </div>
                <p className="text-sm text-gray-500">
                  © 2026 REZ Platform. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
