import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // PKCE flow — exchange code for session server-side
  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll()     { return cookieStore.getAll() },
          setAll(cs)   { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
        }
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/`)
  }

  // Magic-link / hash flow — redirect to client page that finishes the exchange
  return NextResponse.redirect(`${origin}/auth/confirm`)
}
