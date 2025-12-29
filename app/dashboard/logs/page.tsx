import { redirect } from 'next/navigation'
import { getCurrentUser, getSelectedAppId } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileSidebar } from '@/components/dashboard/MobileSidebar'
import { LogsContent } from '@/components/dashboard/LogsContent'
import { prisma } from '@/lib/prisma'

export default async function LogsPage() {
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

  // TODO: Fetch logs from database when Log model is added
  // For now, using empty array
  const logs: any[] = []

  return (
    <div className="min-h-screen relative z-10" suppressHydrationWarning>
      <Sidebar user={user} showAppNav={apps.length > 0} />
      <MobileSidebar user={user} showAppNav={apps.length > 0} />
      <LogsContent user={user} apps={apps} logs={logs} currentAppId={selectedAppId} />
    </div>
  )
}

