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
    const { appId, userIds } = body

    if (!appId) {
      return NextResponse.json({ error: 'App ID is required' }, { status: 400 })
    }

    // Verify the app belongs to the user
    const app = await prisma.application.findFirst({
      where: { id: appId, userId: user.id },
    })

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    let whereClause: any = { applicationId: appId }

    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      whereClause.id = { in: userIds }
    }

    const result = await prisma.appUser.updateMany({
      where: whereClause,
      data: {
        hwid: null,
      },
    })

    return NextResponse.json({ updated: result.count })
  } catch (error: any) {
    console.error('Error resetting HWIDs:', error)
    return NextResponse.json({ error: error.message || 'Failed to reset HWIDs' }, { status: 500 })
  }
}

