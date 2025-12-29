import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET - Fetch user variables for a user
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const appId = searchParams.get('appId')
    const userId = searchParams.get('userId')

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

    const userVars = await prisma.userVar.findMany({
      where: { userId },
    })

    return NextResponse.json({ vars: userVars })
  } catch (error: any) {
    console.error('Error fetching user variables:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch user variables' }, { status: 500 })
  }
}

// POST - Set/Update user variable
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { appId, userId, varName, varValue, readOnly } = body

    if (!appId || !userId || !varName || varValue === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the app belongs to the user
    const app = await prisma.application.findFirst({
      where: { id: appId, userId: user.id },
    })

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Upsert user variable
    const userVar = await prisma.userVar.upsert({
      where: {
        userId_name: {
          userId,
          name: varName,
        },
      },
      update: {
        value: varValue,
        readOnly: readOnly || false,
      },
      create: {
        userId,
        name: varName,
        value: varValue,
        readOnly: readOnly || false,
      },
    })

    return NextResponse.json({ var: userVar })
  } catch (error: any) {
    console.error('Error setting user variable:', error)
    return NextResponse.json({ error: error.message || 'Failed to set user variable' }, { status: 500 })
  }
}

// DELETE - Delete user variable
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { appId, userId, varName } = body

    if (!appId || !userId || !varName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the app belongs to the user
    const app = await prisma.application.findFirst({
      where: { id: appId, userId: user.id },
    })

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    await prisma.userVar.delete({
      where: {
        userId_name: {
          userId,
          name: varName,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting user variable:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete user variable' }, { status: 500 })
  }
}

