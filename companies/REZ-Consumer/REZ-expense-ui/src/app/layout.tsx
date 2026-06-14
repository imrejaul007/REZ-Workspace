import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'REZ Smart Expense',
  description: 'Track your expenses with AI-powered receipt scanning',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen antialiased">
        <main className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
          {children}
        </main>
      </body>
    </html>
  )
}
