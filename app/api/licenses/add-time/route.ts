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
    const { appId, time, expiryUnit } = body

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

    // Update all unused licenses
    const unusedLicenses = await prisma.license.findMany({
      where: {
        applicationId: appId,
        used: false,
      },
    })

    const updates = unusedLicenses.map((license) => {
      const currentExpiry = license.expiry ? new Date(license.expiry) : null
      const newExpiry = currentExpiry
        ? new Date(currentExpiry.getTime() + timeToAdd * 1000)
        : expiryUnit === 315569260
        ? null
        : new Date(Date.now() + timeToAdd * 1000)

      return prisma.license.update({
        where: { id: license.id },
        data: {
          expiry: newExpiry,
          duration: license.duration + timeToAdd,
        },
      })
    })

    await Promise.all(updates)

    return NextResponse.json({ updated: unusedLicenses.length })
  } catch (error: any) {
    console.error('Error adding time to licenses:', error)
    return NextResponse.json({ error: error.message || 'Failed to add time' }, { status: 500 })
  }
}

