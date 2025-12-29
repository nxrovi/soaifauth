import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { appId, userId, username, password, email, subscription, hwid } = body

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

    // Get the current user
    const appUser = await prisma.appUser.findFirst({
      where: { id: userId, applicationId: appId },
    })

    if (!appUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if username is being changed and if it conflicts
    if (username && username !== appUser.username) {
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
    }

    // Prepare update data
    const updateData: any = {}
    if (username) updateData.username = username
    if (email !== undefined) updateData.email = email || null
    if (subscription) updateData.subscription = subscription
    if (hwid !== undefined) updateData.hwid = hwid || null
    if (password) {
      updateData.password = await hashPassword(password)
    }

    const updatedUser = await prisma.appUser.update({
      where: { id: userId },
      data: updateData,
      include: {
        userVars: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 })
  }
}

