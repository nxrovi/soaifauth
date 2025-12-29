import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileSidebar } from '@/components/dashboard/MobileSidebar'
import { getCurrentUser } from '@/lib/auth'
import { Upgrade } from '@/components/dashboard/Upgrade'

export default async function UpgradePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen relative z-10" suppressHydrationWarning>
      <Sidebar user={user} showAppNav={false} />
      <MobileSidebar user={user} showAppNav={false} />
      <div className="p-4 sm:p-8 lg:ml-72">
        <Upgrade user={user} />
      </div>
    </div>
  )
}

