import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/lib/supabase/types'

const VALID_ROLES: UserRole[] = [
  'admin',
  'staff',
  'hv_risk',
  'cc_agent',
  'installer',
  'operations',
  'finance',
  'after_sales',
]

interface UserPayload {
  full_name: string
  email: string
  password: string
  role: string
  phone: string
}

export async function POST(request: Request) {
  // Verify caller is an authenticated admin
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  const body = await request.json()
  const users: UserPayload[] = body?.users

  if (!Array.isArray(users) || users.length === 0) {
    return NextResponse.json({ error: 'No users provided' }, { status: 400 })
  }

  // Service-role client for auth.admin operations
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const results = await Promise.all(
    users.map(async (u: UserPayload) => {
      if (!VALID_ROLES.includes(u.role as UserRole)) {
        return { email: u.email, status: 'Failed' as const, error: `Invalid role: ${u.role}` }
      }

      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      })

      if (authError || !authData.user) {
        return {
          email: u.email,
          status: 'Failed' as const,
          error: authError?.message ?? 'Failed to create auth user',
        }
      }

      const { error: profileError } = await adminClient.from('user_profiles').insert({
        id: authData.user.id,
        full_name: u.full_name,
        phone: u.phone,
        role: u.role,
      })

      if (profileError) {
        // Roll back orphaned auth user so we don't leave dangling accounts
        await adminClient.auth.admin.deleteUser(authData.user.id)
        return {
          email: u.email,
          status: 'Failed' as const,
          error: profileError.message,
        }
      }

      return { email: u.email, status: 'Created' as const }
    })
  )

  return NextResponse.json({ results })
}
