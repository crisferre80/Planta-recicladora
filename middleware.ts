import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

// Map routes to required roles
const routeRoleMap: Record<string, UserRole[]> = {
  '/dashboard': ['ADMIN', 'SUPERVISOR', 'OPERADOR', 'CONTADOR'],
  '/personal': ['ADMIN', 'SUPERVISOR', 'OPERADOR'],
  '/produccion': ['ADMIN', 'SUPERVISOR', 'OPERADOR'],
  '/comercial': ['ADMIN', 'SUPERVISOR', 'CONTADOR'],
  '/admin': ['ADMIN'],
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Check if user has access to the route
    for (const [route, allowedRoles] of Object.entries(routeRoleMap)) {
      if (path.startsWith(route)) {
        const userRole = token?.role as UserRole
        
        if (!allowedRoles.includes(userRole)) {
          // Redirect to unauthorized page or dashboard
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

// Protect all routes except public ones
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/personal/:path*',
    '/produccion/:path*',
    '/comercial/:path*',
    '/admin/:path*',
  ],
}
