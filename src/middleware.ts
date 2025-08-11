import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('x-middleware', 'hit')
  console.log('🔍 MIDDLEWARE WORKS:', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: ['/sign-in', '/dashboard', '/practice/:path*']
}


