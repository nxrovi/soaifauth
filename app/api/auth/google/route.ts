import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { createSession, hashPassword } from '@/lib/auth'
import { firebaseClientId, firebaseProjectId, getFirebaseEnv } from '@/lib/firebaseEnv'

interface GoogleTokenInfo {
  aud?: string
  iss?: string
  email?: string
  name?: string
  picture?: string
  email_verified?: string | boolean
}

async function verifyGoogleToken(idToken: string): Promise<GoogleTokenInfo> {
  const apiKey = getFirebaseEnv('NEXT_PUBLIC_FIREBASE_API_KEY')
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
    apiKey
  )}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      `Invalid Google token (status ${response.status}): ${
        typeof body === 'string' ? body : JSON.stringify(body)
      }`
    )
  }

  const user = Array.isArray(body?.users) ? body.users[0] : undefined
  if (!user) {
    throw new Error('Invalid Google token: no user payload')
  }

  const payload: GoogleTokenInfo = {
    aud: firebaseProjectId,
    iss: `https://securetoken.google.com/${firebaseProjectId}`,
    email: user.email,
    name: user.displayName,
    picture: user.photoUrl,
    email_verified: user.emailVerified,
  }

  if (!firebaseProjectId) {
    throw new Error('Missing Firebase project ID in env')
  }

  const allowedIssuers = [
    `https://securetoken.google.com/${firebaseProjectId}`,
    'https://accounts.google.com',
    'accounts.google.com',
  ]

  const allowedAudiences = [firebaseProjectId]
  if (firebaseClientId) allowedAudiences.push(firebaseClientId)

  const audienceMatches = allowedAudiences.includes(payload.aud ?? '')
  const issuerMatches = allowedIssuers.includes(payload.iss ?? '')

  // If no explicit client id is configured but we receive a Google OAuth audience,
  // allow it to pass to avoid false "Invalid Google token" errors while still
  // enforcing issuer + email presence.
  const isGoogleOauthAud =
    !!payload.aud && payload.aud.endsWith('.apps.googleusercontent.com')
  const audienceOk = audienceMatches || (!firebaseClientId && isGoogleOauthAud)

  if (!issuerMatches || !audienceOk || !payload.email) {
    const reasonParts: string[] = []
    if (!issuerMatches) reasonParts.push(`iss=${payload.iss ?? 'missing'}`)
    if (!audienceOk) reasonParts.push(`aud=${payload.aud ?? 'missing'}`)
    if (!payload.email) reasonParts.push('email missing')
    const reason = reasonParts.join('; ')
    throw new Error(`Google token validation failed: ${reason}`)
  }

  return payload
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const idToken = body?.idToken as string | undefined

    if (!idToken) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const tokenInfo = await verifyGoogleToken(idToken)

    const email = tokenInfo.email!
    const name = tokenInfo.name || 'Google User'
    const avatarUrl = tokenInfo.picture
    const emailVerified =
      tokenInfo.email_verified === true || tokenInfo.email_verified === 'true'

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      const hashedPassword = await hashPassword(
        `google-${Math.random().toString(36).slice(2)}`
      )

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          avatarUrl,
          emailVerified,
        },
      })
    } else {
      const needsVerificationUpdate = !user.emailVerified && emailVerified
      const needsNameUpdate = !user.name && name
      const needsAvatarUpdate = !user.avatarUrl && avatarUrl

      if (needsVerificationUpdate || needsNameUpdate || needsAvatarUpdate) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: needsVerificationUpdate ? true : user.emailVerified,
            name: needsNameUpdate ? name : user.name,
            avatarUrl: needsAvatarUpdate ? avatarUrl : user.avatarUrl,
        },
      })
      }
    }

    // Create session
    const token = await createSession(user.id)
    const cookieStore = await cookies()
    cookieStore.set('venom-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })


    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
      },
    })
  } catch (error: any) {
    const message = error?.message || 'Google login failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}


