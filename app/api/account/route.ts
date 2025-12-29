import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { accountUpdateSchema } from '@/lib/validations'

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ user })
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = accountUpdateSchema.safeParse(body)

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid payload'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { name, avatarUrl } = parsed.data
  const dataToUpdate: { name?: string | null; avatarUrl?: string | null } = {}

  if (name !== undefined) {
    dataToUpdate.name = name.trim() || null
  }

  if (avatarUrl !== undefined) {
    dataToUpdate.avatarUrl = avatarUrl.trim() || null
  }

  if (!Object.keys(dataToUpdate).length) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: dataToUpdate,
  })

  return NextResponse.json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatarUrl: updated.avatarUrl,
      emailVerified: updated.emailVerified,
    },
  })
}


