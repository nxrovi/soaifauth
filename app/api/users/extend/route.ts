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
    const { appId, username, subscription, time, expiryUnit, activeOnly } = body

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

    const timeToAdd = parseInt(time) * parseInt(expiryUnit)

    let whereClause: any = {
      applicationId: appId,
    }

    if (username && username !== 'all') {
      whereClause.username = username
    }

    if (subscription && subscription !== 'default') {
      whereClause.subscription = subscription
    }

    if (activeOnly) {
      whereClause.expiry = {
        OR: [
          { gte: new Date() },
          { equals: null },
        ],
      }
    }

    const users = await prisma.appUser.findMany({
      where: whereClause,
    })

    const updates = users.map((appUser) => {
      const currentExpiry = appUser.expiry ? new Date(appUser.expiry) : null
      const newExpiry = currentExpiry
        ? new Date(currentExpiry.getTime() + timeToAdd * 1000)
        : expiryUnit === 315569260
        ? null
        : new Date(Date.now() + timeToAdd * 1000)

      return prisma.appUser.update({
        where: { id: appUser.id },
        data: { expiry: newExpiry },
      })
    })

    await Promise.all(updates)

    return NextResponse.json({ updated: users.length })
  } catch (error: any) {
    console.error('Error extending users:', error)
    return NextResponse.json({ error: error.message || 'Failed to extend users' }, { status: 500 })
  }
}

