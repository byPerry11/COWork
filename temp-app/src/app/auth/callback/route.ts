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

    if (!error) {
      console.log('Auth Callback: Session exchanged successfully for user:', data.user?.email)
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        console.log('Auth Callback: Local environment detected, redirecting to:', `${origin}${next}`)
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        console.log('Auth Callback: Forwarded host detected, redirecting to:', `https://${forwardedHost}${next}`)
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        console.log('Auth Callback: Production/Preview environment, redirecting to:', `${origin}${next}`)
        return NextResponse.redirect(`${origin}${next}`)
      }
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
