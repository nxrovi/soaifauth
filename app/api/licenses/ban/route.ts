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
    const { appId, licenseId, reason } = body

    if (!appId || !licenseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the app belongs to the user
    const app = await prisma.application.findFirst({
      where: { id: appId, userId: user.id },
    })

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const license = await prisma.license.update({
      where: { id: licenseId },
      data: {
        banned: true,
        banReason: reason || null,
      },
    })

    return NextResponse.json({ license })
  } catch (error: any) {
    console.error('Error banning license:', error)
    return NextResponse.json({ error: error.message || 'Failed to ban license' }, { status: 500 })
  }
}

