import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes for each role
const protectedRoutes = {
  admin: ['/dashboard/admin'],
  restaurant: ['/dashboard/restaurant'],
  employee: ['/dashboard/employee'], 
  vendor: ['/dashboard/vendor'],
}

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/jobs',
  '/marketplace',
  '/community',
  '/restaurants',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
]

// API routes that should be excluded from middleware
const apiRoutes = ['/api/', '/_next/', '/favicon.ico']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (apiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Get user data from cookies or headers  
  const token = request.cookies.get('auth_token')?.value
  const userRole = request.cookies.get('user_role')?.value as keyof typeof protectedRoutes

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') return pathname === '/'
    return pathname.startsWith(route)
  })

  // Allow access to public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Redirect to login if no token
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access for protected routes
  if (userRole && protectedRoutes[userRole]) {
    const allowedRoutes = protectedRoutes[userRole]
    const hasAccess = allowedRoutes.some(route => pathname.startsWith(route))
    
    // If trying to access a dashboard route but not authorized for this role
    if (pathname.startsWith('/dashboard/') && !hasAccess) {
      // Redirect to their appropriate dashboard
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}