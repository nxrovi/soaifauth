import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const appId = searchParams.get('appId')

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

  const users = await prisma.appUser.findMany({
    where: { applicationId: appId },
    orderBy: { createdAt: 'desc' },
    include: {
      userVars: true,
    },
  })

  return NextResponse.json({ users })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { appId, username, password, email, subscription, expiry } = body

    if (!appId || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the app belongs to the user
    const app = await prisma.application.findFirst({
      where: { id: appId, userId: user.id },
    })

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Check if username already exists for this app
    const existingUser = await prisma.appUser.findUnique({
      where: {
        applicationId_username: {
          applicationId: appId,
          username,
        },
      },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const appUser = await prisma.appUser.create({
      data: {
        applicationId: appId,
        username,
        password: hashedPassword,
        email: email || null,
        subscription: subscription || 'default',
        expiry: expiry ? new Date(expiry) : null,
      },
    })

    return NextResponse.json({ user: appUser }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { appId, type, userIds } = body

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

    if (type === 'expired') {
      whereClause.expiry = { lt: new Date() }
    } else if (userIds && Array.isArray(userIds)) {
      whereClause.id = { in: userIds }
    }

    const result = await prisma.appUser.deleteMany({
      where: whereClause,
    })

    return NextResponse.json({ deleted: result.count })
  } catch (error: any) {
    console.error('Error deleting users:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete users' }, { status: 500 })
  }
}

