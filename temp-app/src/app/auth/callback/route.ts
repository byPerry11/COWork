import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    console.log('Auth Callback: Code received, exchanging for session...')
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      console.log('Auth Callback: Session exchanged successfully for user:', data.user?.email)
      
      // Ensure profile exists after OAuth login
      const { user } = data
      const metadata = user.user_metadata
      
      try {
        // We use upsert to create or update the profile without failing if it exists
        // This is safe even if a database trigger already handles this
        await supabase.from('profiles').upsert({
          id: user.id,
          username: metadata.username || user.email?.split('@')[0] || `user_${user.id.slice(0, 5)}`,
          display_name: metadata.display_name || metadata.full_name || metadata.name || null,
          avatar_url: metadata.avatar_url || null,
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'id',
          ignoreDuplicates: true // Only insert if not exists to preserve existing custom data
        })
      } catch (profileError) {
        console.error('Auth Callback: Error ensuring profile exists:', profileError)
      }

      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Auth Callback: Error exchanging code for session:', error)
    }
  } else {
    console.warn('Auth Callback: No code provided in URL')
  }

  // return the user to an error page with instructions
  // Forward original search params to preserve error details from Supabase if any
  const errorParams = new URLSearchParams()
  searchParams.forEach((value, key) => {
    errorParams.append(key, value)
  })

  console.log('Auth Callback: Redirecting to auth-code-error with params:', errorParams.toString())
  return NextResponse.redirect(`${origin}/auth/auth-code-error?${errorParams.toString()}`)
}
