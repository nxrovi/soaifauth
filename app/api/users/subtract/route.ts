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
    const { appId, username, subscription, time, expiryUnit } = body

    if (!appId || !time || !expiryUnit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the app belongs to the user
    const app = await prisma.application.findFirst({
      where: { id: appId, userId: user.id },
    })

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const timeToSubtract = parseInt(time) * parseInt(expiryUnit)

    let whereClause: any = {
      applicationId: appId,
    }

    if (username && username !== 'all') {
      whereClause.username = username
    }

    if (subscription && subscription !== 'default') {
      whereClause.subscription = subscription
    }

    const users = await prisma.appUser.findMany({
      where: whereClause,
    })

    const updates = users.map((appUser) => {
      if (!appUser.expiry) return null

      const currentExpiry = new Date(appUser.expiry)
      const newExpiry = new Date(currentExpiry.getTime() - timeToSubtract * 1000)

      // Don't go into the past beyond now
      const finalExpiry = newExpiry < new Date() ? new Date() : newExpiry

      return prisma.appUser.update({
        where: { id: appUser.id },
        data: { expiry: finalExpiry },
      })
    })

    await Promise.all(updates.filter(Boolean))

    return NextResponse.json({ updated: users.length })
  } catch (error: any) {
    console.error('Error subtracting time from users:', error)
    return NextResponse.json({ error: error.message || 'Failed to subtract time' }, { status: 500 })
  }
}

