import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileSidebar } from '@/components/dashboard/MobileSidebar'
import { getCurrentUser } from '@/lib/auth'
import { AccountSettings } from '@/components/dashboard/AccountSettings'

export default async function AccountSettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen relative z-10" suppressHydrationWarning>
      <Sidebar user={user} showAppNav={false} />
      <MobileSidebar user={user} showAppNav={false} />
      <div className="p-4 sm:p-8 lg:ml-72">
        <AccountSettings user={user} />
      </div>
    </div>
  )
}


