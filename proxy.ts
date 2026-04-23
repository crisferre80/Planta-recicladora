import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log('🔒 Proxy:', {
    path: req.nextUrl.pathname,
    hasSession: !!session,
    userEmail: session?.user?.email
  })

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // Si no hay sesión y está intentando acceder a rutas protegidas
  if (!session && !isPublicRoute) {
    console.log('❌ Sin sesión, redirigiendo a /login')
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Si hay sesión y está en login o register, redirigir al dashboard
  if (session && isPublicRoute) {
    console.log('✅ Con sesión en ruta pública, redirigiendo a /dashboard')
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  console.log('➡️ Permitiendo acceso')
  return response
}

// Proteger todas las rutas excepto las públicas
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/personal/:path*',
    '/produccion/:path*',
    '/comercial/:path*',
    '/alertas/:path*',
    '/login',
    '/register',
  ],
}
