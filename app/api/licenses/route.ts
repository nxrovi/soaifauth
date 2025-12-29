import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import crypto from 'crypto'

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

  const licenses = await prisma.license.findMany({
    where: { applicationId: appId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ licenses })
}

function generateLicenseKey(mask: string, options: { lowercase: boolean; uppercase: boolean }): string {
  const chars = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
  }

  let availableChars = chars.numbers
  if (options.lowercase) availableChars += chars.lowercase
  if (options.uppercase) availableChars += chars.uppercase

  return mask
    .split('')
    .map((char) => {
      if (char === '*') {
        return availableChars[Math.floor(Math.random() * availableChars.length)]
      }
      return char
    })
    .join('')
}

function calculateExpiry(duration: number, unit: number): Date | null {
  if (unit === 315569260) return null // Lifetime
  const totalSeconds = duration * unit
  return new Date(Date.now() + totalSeconds * 1000)
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      appId,
      amount,
      mask,
      level,
      duration,
      expiryUnit,
      note,
      lowercaseLetters,
      uppercaseLetters,
    } = body

    if (!appId || !amount || !mask || !duration || !expiryUnit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the app belongs to the user
    const app = await prisma.application.findFirst({
      where: { id: appId, userId: user.id },
    })

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const licenses = []
    const expiry = calculateExpiry(parseInt(duration), parseInt(expiryUnit))

    for (let i = 0; i < parseInt(amount); i++) {
      const key = generateLicenseKey(mask, {
        lowercase: lowercaseLetters ?? true,
        uppercase: uppercaseLetters ?? true,
      })

      const license = await prisma.license.create({
        data: {
          applicationId: appId,
          key,
          level: parseInt(level) || 1,
          duration: parseInt(duration) * parseInt(expiryUnit),
          expiry,
          note: note || null,
        },
      })

      licenses.push(license)
    }

    return NextResponse.json({ licenses, count: licenses.length }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating licenses:', error)
    return NextResponse.json({ error: error.message || 'Failed to create licenses' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { appId, type, licenseIds } = body

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

    if (type === 'used') {
      whereClause.used = true
    } else if (type === 'unused') {
      whereClause.used = false
    } else if (licenseIds && Array.isArray(licenseIds)) {
      whereClause.id = { in: licenseIds }
    }

    const result = await prisma.license.deleteMany({
      where: whereClause,
    })

    return NextResponse.json({ deleted: result.count })
  } catch (error: any) {
    console.error('Error deleting licenses:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete licenses' }, { status: 500 })
  }
}

