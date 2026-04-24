import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/request'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('auth_session')?.value
  const { pathname } = request.nextUrl
  const adminPhone = '9876543210'

  // 1. If user is logged in, don't let them go to the login page
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 2. Protect Admin Routes (The Firewall)
  if (pathname.startsWith('/admin')) {
    // Exclude the login and denied pages from protection to avoid redirect loops
    if (pathname === '/admin/login' || pathname === '/admin/denied') {
      return NextResponse.next()
    }

    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Strict Admin Identity Check
    if (session !== adminPhone) {
      console.warn(`[Security] Unauthorized admin access attempt from ${session}`);
      return NextResponse.redirect(new URL('/admin/denied', request.url))
    }
  }


  
  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/admin/:path*'], // Add more protected routes here
}
