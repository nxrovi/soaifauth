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
    const { appId, userIds, action } = body // action: 'pause' or 'unpause'

    if (!appId || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the app belongs to the user
    const app = await prisma.application.findFirst({
      where: { id: appId, userId: user.id },
    })

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const result = await prisma.appUser.updateMany({
      where: {
        applicationId: appId,
        id: { in: userIds },
      },
      data: {
        paused: action === 'pause',
      },
    })

    return NextResponse.json({ updated: result.count })
  } catch (error: any) {
    console.error('Error pausing/unpausing users:', error)
    return NextResponse.json({ error: error.message || 'Failed to update users' }, { status: 500 })
  }
}

