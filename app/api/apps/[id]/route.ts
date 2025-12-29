import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const name = (body?.name as string | undefined)?.trim()
  const action = (body?.action as string | undefined)?.trim()
  const status = (body?.status as string | undefined)?.trim()

  const app = await prisma.application.findFirst({
    where: { id: params.id, userId: user.id },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'set-status') {
    const allowed = ['active', 'paused']
    if (!status || !allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const updated = await prisma.application.update({
      where: { id: app.id },
      data: { status },
    })
    return NextResponse.json({ app: updated })
  }

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const updated = await prisma.application.update({
    where: { id: app.id },
    data: { name },
  })
  return NextResponse.json({ app: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.application.deleteMany({
    where: { id: params.id, userId: user.id },
  })

  return NextResponse.json({ ok: true })
}

