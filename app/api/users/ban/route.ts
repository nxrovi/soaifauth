import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { appId, userId, reason } = body

    if (!appId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the app belongs to the user
    const app = await prisma.application.findFirst({
      where: { id: appId, userId: user.id },
    })

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const appUser = await prisma.appUser.update({
      where: { id: userId },
      data: {
        banned: true,
        banReason: reason || null,
      },
    })

    return NextResponse.json({ user: appUser })
  } catch (error: any) {
    console.error('Error banning user:', error)
    return NextResponse.json({ error: error.message || 'Failed to ban user' }, { status: 500 })
  }
}

