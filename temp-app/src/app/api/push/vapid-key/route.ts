import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  // Return the VAPID public key for client-side subscription
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  if (!publicKey) {
    return NextResponse.json(
      { error: 'VAPID public key not configured' },
      { status: 500 }
    )
  }

  return NextResponse.json({ publicKey })
}
