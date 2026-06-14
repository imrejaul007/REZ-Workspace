import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BIZORA Trust Dashboard',
  description: 'Trust& Verification Dashboard for BIZORA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-trust-500 to-trust-700 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944am-4.242 4.242a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">BIZORA</h1>
                    <p className="text-xs text-slate-500">Trust & Verification Platform</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600">Enterprise Partner</span>
                  <div className="w-8 h-8 bg-trust-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-trust-700">EP</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>BIZORA Trust Dashboard v1.0</span>
                <span>Powered by REZ Ecosystem</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
