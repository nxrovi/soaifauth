import { redirect } from 'next/navigation'
import { getCurrentUser, getSelectedAppId } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileSidebar } from '@/components/dashboard/MobileSidebar'
import { FilesContent } from '@/components/dashboard/FilesContent'
import { prisma } from '@/lib/prisma'

export default async function FilesPage() {
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

  // TODO: Fetch files from database when File model is added
  // For now, using empty array
  const files: any[] = []

  return (
    <div className="min-h-screen relative z-10" suppressHydrationWarning>
      <Sidebar user={user} showAppNav={apps.length > 0} />
      <MobileSidebar user={user} showAppNav={apps.length > 0} />
      <FilesContent user={user} apps={apps} files={files} currentAppId={selectedAppId} />
    </div>
  )
}

