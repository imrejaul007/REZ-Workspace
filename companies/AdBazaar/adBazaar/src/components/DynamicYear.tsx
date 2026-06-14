'use client'

import { useState, useEffect } from 'react'

/**
 * DynamicYear Component
 *
 * Renders the copyright year on the client side to avoid hydration mismatches.
 * Server renders with initial value, then updates on client.
 *
 * CRITICAL HYDRATION FIX: Using new Date() directly in server components
 * causes timezone-related hydration mismatches. This component safely
 * handles the dynamic year on the client side.
 */
export default function DynamicYear() {
  const [year, setYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    // Update year after hydration in case we've crossed into a new year
    setYear(new Date().getFullYear())
  }, [])

  return (
    <span suppressHydrationWarning>&copy; {year}</span>
  )
}
