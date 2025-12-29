import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { AppSelectionContent } from '@/components/apps/AppSelectionContent'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileSidebar } from '@/components/dashboard/MobileSidebar'

export default async function AppsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const apps = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  })

  const cookieStore = await cookies()
  const selectedAppId = cookieStore.get('selected-app-id')?.value

  // If an app is already selected, redirect to dashboard
  if (selectedAppId) {
    const selectedApp = apps.find(app => app.id === selectedAppId)
    if (selectedApp) {
      redirect('/dashboard')
    }
  }

  return (
    <div className="min-h-screen relative z-10" suppressHydrationWarning>
      <Sidebar user={user} showAppNav={false} />
      <MobileSidebar user={user} showAppNav={false} />
      <AppSelectionContent user={user} apps={apps} />
    </div>
  )
}

