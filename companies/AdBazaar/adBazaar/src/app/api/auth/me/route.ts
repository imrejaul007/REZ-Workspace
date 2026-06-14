import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import logger from '@/lib/logger'

/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user's information.
 * Used by client components to display actual user role and email.
 *
 * CRITICAL SECURITY FIX: Admin layout previously displayed hardcoded "Admin" role,
 * which could mislead users about their actual permissions. This endpoint
 * provides the real role from the database.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: (name: string, value: string) => {
            request.cookies.set({ name, value })
          },
          remove: (name: string) => {
            request.cookies.set({ name, value: '' })
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch user role from database
    let role: string | null = null
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', user.id)
        .single()

      role = userData?.role ?? null
    } catch (e) {
      logger.warn('[API/auth/me] Failed to fetch user role', { error: e instanceof Error ? e.message : String(e) })
      // Continue without role - don't fail the request
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: role,
      // Don't expose sensitive data
    })
  } catch (error) {
    logger.error('[API/auth/me] Error fetching user info', error)
    return NextResponse.json(
      { error: 'Failed to fetch user info' },
      { status: 500 }
    )
  }
}
