import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Token } from '@prisma/client'

const TOKEN_TYPE: Token['type'] = 'PASSWORD_RESET'
const EXPIRES_MINUTES = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = (body?.email as string | undefined)?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Avoid leaking which emails exist
      return NextResponse.json({ message: 'If the email exists, a reset link was sent.' }, { status: 200 })
    }

    const expiresAt = new Date(Date.now() + EXPIRES_MINUTES * 60 * 1000)
    const token = crypto.randomUUID()

    await prisma.token.create({
      data: {
        userId: user.id,
        token,
        type: TOKEN_TYPE,
        expiresAt,
      },
    })

    // TODO: Hook up email delivery. For now, we just return success without sending.
    return NextResponse.json({ message: 'If the email exists, a reset link was sent.' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


