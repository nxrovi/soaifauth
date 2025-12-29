import { redirect } from 'next/navigation'
import { getCurrentUser, getSelectedAppId } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileSidebar } from '@/components/dashboard/MobileSidebar'
import { UsersContent } from '@/components/dashboard/UsersContent'
import { prisma } from '@/lib/prisma'

export default async function UsersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const selectedAppId = await getSelectedAppId()
  
  // If no app is selected, redirect to app selection page
  if (!selectedAppId) {
    redirect('/apps')
  }

  const apps = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  })

  // Verify the selected app belongs to the user
  const selectedApp = apps.find(app => app.id === selectedAppId)
  if (!selectedApp) {
    // Selected app doesn't exist or doesn't belong to user, redirect to selection
    redirect('/apps')
  }

  const users = await prisma.appUser.findMany({
    where: { applicationId: selectedAppId },
    orderBy: { createdAt: 'desc' },
    include: {
      userVars: true,
    },
  })

  return (
    <div className="min-h-screen relative z-10" suppressHydrationWarning>
      <Sidebar user={user} showAppNav={apps.length > 0} />
      <MobileSidebar user={user} showAppNav={apps.length > 0} />
      <UsersContent user={user} apps={apps} users={users} currentAppId={selectedAppId} />
    </div>
  )
}

