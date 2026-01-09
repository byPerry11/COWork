import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server

export async function POST(request: NextRequest) {
  try {
    const { subscription, userId, userAgent } = await request.json()

    if (!subscription || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract subscription details
    const { endpoint, keys } = subscription
    const { p256dh, auth } = keys

    // Save subscription to database
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint,
        p256dh_key: p256dh,
        auth_key: auth,
        user_agent: userAgent || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      })
      .select()

    if (error) {
      console.error('Error saving subscription:', error)
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error in subscribe endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
