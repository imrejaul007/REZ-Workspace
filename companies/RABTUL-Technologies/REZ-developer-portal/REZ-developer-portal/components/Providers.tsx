'use client'

import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white antialiased">
      {children}
    </div>
  )
}
