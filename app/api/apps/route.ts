import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import crypto from 'crypto'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apps = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ apps })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const name = (body?.name as string | undefined)?.trim()

  if (!name) {
    return NextResponse.json({ error: 'App name is required' }, { status: 400 })
  }

  const app = await prisma.application.create({
    data: {
      name,
      userId: user.id,
      ownerId: user.id,
      secret: crypto.randomBytes(32).toString('hex'),
      status: 'active',
      version: '1.0',
    },
  })

  return NextResponse.json({ app }, { status: 201 })
}

