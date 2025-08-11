import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export default auth((request) => {
  const { nextUrl, auth: session } = request

  // Always mark middleware execution for verification
  const response = NextResponse.next()
  response.headers.set('x-middleware', 'hit')

  // If already authenticated and visiting /sign-in, redirect to /dashboard
  if (nextUrl.pathname === '/sign-in' && session?.user) {
    const url = new URL('/dashboard', nextUrl)
    return NextResponse.redirect(url)
  }

  // If unauthenticated and visiting protected routes, redirect to /sign-in
  const isProtected =
    nextUrl.pathname === '/dashboard' || nextUrl.pathname.startsWith('/practice')
  if (isProtected && !session?.user) {
    const signInUrl = new URL('/sign-in', nextUrl)
    return NextResponse.redirect(signInUrl)
  }

  return response
})

export const config = {
  matcher: ['/sign-in', '/dashboard', '/practice/:path*']
}


