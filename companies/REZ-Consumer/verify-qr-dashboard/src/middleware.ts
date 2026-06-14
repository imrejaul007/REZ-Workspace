import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Security headers to apply
const securityHeaders = {
 'X-DNS-Prefetch-Control': 'on',
 'X-Frame-Options': 'DENY',
 'X-Content-Type-Options': 'nosniff',
 'X-XSS-Protection': '1; mode=block',
 'Referrer-Policy': 'strict-origin-when-cross-origin',
 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
 'Content-Security-Policy': [
   "default-src 'self'",
   "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
   "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
   "font-src 'self' https://fonts.gstatic.com",
   "img-src 'self' data: https: blob:",
   "connect-src 'self' https://*.rez.money https://*.onrender.com",
   "frame-ancestors 'none'",
 ].join('; '),
};

// Allowed origins for CORS
const allowedOrigins = (
 process.env.ALLOWED_ORIGINS || 'https://rez.money,https://www.rez.money'
).split(',');

export function middleware(request: NextRequest) {
 const { pathname } = request.nextUrl;

 // 1. Apply security headers
 const response = NextResponse.next();

 Object.entries(securityHeaders).forEach(([key, value]) => {
   response.headers.set(key, value);
 });

 // 2. HTTPS redirect in production
 if (
   process.env.NODE_ENV === 'production' &&
   request.headers.get('x-forwarded-proto') !== 'https'
 ) {
   const url = request.url.replace(/^http:\/\//i, 'https://');
   return NextResponse.redirect(url, 301);
 }

 // 3. CORS headers for API routes
 if (pathname.startsWith('/api/')) {
   const origin = request.headers.get('origin');

   if (origin && allowedOrigins.includes(origin)) {
     response.headers.set('Access-Control-Allow-Origin', origin);
     response.headers.set('Access-Control-Allow-Credentials', 'true');
     response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
     response.headers.set(
       'Access-Control-Allow-Headers',
       'Content-Type, Authorization, X-Internal-Token, X-Api-Key'
     );
     response.headers.set('Access-Control-Max-Age', '86400');
   }

   // Rate limiting headers (if rate limit service is available)
   response.headers.set('X-RateLimit-Limit', '100');
   response.headers.set('X-RateLimit-Remaining', '99');
 }

 // 4. Admin route protection
 if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
   // Check for internal token or admin session
   const internalToken = request.headers.get('x-internal-token');
   const apiKey = request.headers.get('x-api-key');
   const adminSession = request.cookies.get('admin_session');

   // If none provided, block access
   if (!internalToken && !apiKey && !adminSession) {
     // Allow the request through to API route handler which will return 401
     // For pages, redirect to login
     if (!pathname.startsWith('/api/')) {
       const loginUrl = new URL('/login', request.url);
       loginUrl.searchParams.set('redirect', pathname);
       return NextResponse.redirect(loginUrl);
     }
   }
 }

 // 5. Block common attack patterns
 const suspiciousPatterns = [
   /\.\.\//, // Path traversal
   /<script/i, // XSS attempt
   /javascript:/i, // JavaScript protocol
   /on\w+=/i, // Event handlers
 ];

 for (const pattern of suspiciousPatterns) {
   if (pattern.test(pathname) || pattern.test(request.url)) {
     return NextResponse.json(
       { error: 'Bad request', message: 'Suspicious pattern detected' },
       { status: 400 }
     );
   }
 }

 return response;
}

// Configure which paths the middleware runs on
export const config = {
 matcher: [
   // Match all paths except static files and images
   '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
 ],
};
