import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/lib/supabase/types'

const ROLE_HOMES: Record<UserRole, string> = {
  admin: '/admin',
  staff: '/staff',
  cc_agent: '/staff',
  installer: '/installer',
  hv_risk: '/risk',
  operations: '/operations',
  finance: '/finance',
  after_sales: '/after-sales',
}

// Each entry: URL prefix → roles allowed to access it
const ROUTE_GUARDS: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: '/admin', roles: ['admin'] },
  { prefix: '/installer', roles: ['installer'] },
  { prefix: '/risk', roles: ['hv_risk'] },
  { prefix: '/operations', roles: ['operations'] },
  { prefix: '/finance', roles: ['finance'] },
  { prefix: '/after-sales', roles: ['after_sales'] },
  { prefix: '/staff', roles: ['staff', 'cc_agent'] },
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pass through public routes without any auth check
  if (pathname === '/login' || pathname.startsWith('/c/')) {
    return NextResponse.next({ request })
  }

  try {
    // Supabase SSR client — must forward cookies from request and carry any
    // refreshed tokens back through supabaseResponse.
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // getUser() validates the JWT server-side (no DB call for basic auth check)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Fetch role for route-guard decisions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role as UserRole | null
    const roleHome = role ? (ROLE_HOMES[role] ?? '/staff') : '/staff'

    // Root → role home
    if (pathname === '/') {
      return NextResponse.redirect(new URL(roleHome, request.url))
    }

    // Protect route groups — redirect if role doesn't belong
    for (const { prefix, roles } of ROUTE_GUARDS) {
      if (pathname.startsWith(prefix) && role && !roles.includes(role)) {
        return NextResponse.redirect(new URL(roleHome, request.url))
      }
    }

    return supabaseResponse
  } catch (err) {
    // Fail secure: any unexpected error (missing env vars, network, etc.)
    // must never silently let an unauthenticated request through.
    console.error('[proxy] auth check failed, redirecting to /login:', err)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
