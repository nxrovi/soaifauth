import { NextResponse } from 'next/server'
import { getSelectedAppId } from '@/lib/auth'

export async function GET() {
  const appId = await getSelectedAppId()
  return NextResponse.json({ appId })
}

