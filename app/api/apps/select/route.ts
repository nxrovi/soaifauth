import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const appId = body?.appId as string | undefined

  if (!appId) {
    return NextResponse.json({ error: 'App ID is required' }, { status: 400 })
  }

  // Verify the app belongs to the user
  const app = await prisma.application.findFirst({
    where: {
      id: appId,
      userId: user.id,
    },
  })

  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  // Store selected app in cookie
  const cookieStore = await cookies()
  cookieStore.set('selected-app-id', appId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return NextResponse.json({ success: true, app })
}

