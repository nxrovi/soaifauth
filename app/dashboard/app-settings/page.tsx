import { redirect } from 'next/navigation'
import { getCurrentUser, getSelectedAppId } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileSidebar } from '@/components/dashboard/MobileSidebar'
import { AppSettingsContent } from '@/components/dashboard/AppSettingsContent'
import { prisma } from '@/lib/prisma'

export default async function AppSettingsPage() {
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

  // TODO: Fetch app settings from database
  // For now, using placeholder data
  const appSettings: any = {
    status: '1',
    hwidLock: '1',
    forceHwid: '1',
    vpnBlock: '0',
    hashCheck: '0',
    blockLeakedPasswords: '0',
    tokenValidation: '0',
    minHwid: 20,
    version: '1.0',
    download: '',
    webdownload: '',
    webhook: '',
    ipLogging: '1',
    cooldownexpiry: '86400',
    cooldownduration: 7,
    sessionexpiry: '3600',
    sessionduration: 6,
    minUsernameLength: 1,
    // Alert messages
    appdisabled: 'This application is disabled',
    tokeninvalid: 'Please provide a valid token for you to proceed',
    hashcheckfail: 'This program hash does not match, make sure you\'re using latest version',
    vpnblocked: 'VPNs are blocked on this application',
    usernametaken: 'Username already taken, choose a different one',
    keynotfound: 'Invalid license key',
    keyused: 'License key has already been used',
    keybanned: 'Your license is banned',
    nosublevel: 'There is no subscription created for your key level. Contact application developer.',
    userbanned: 'The user is banned',
    usernamenotfound: 'Invalid username',
    passmismatch: 'Password does not match.',
    hwidmismatch: 'HWID doesn\'t match. Ask for a HWID reset',
    noactivesubs: 'No active subscription(s) found',
    hwidblacked: 'You\'ve been blacklisted from our application',
    pausedsub: 'Your subscription is paused and can\'t be used right now',
    sessionunauthed: 'Session is not validated',
    loggedInMsg: 'Logged in!',
    pausedApp: 'Application is currently paused, please wait for the developer to say otherwise.',
    unTooShort: 'Username too short, try longer one.',
    pwLeaked: 'This password has been leaked in a data breach (not from us), please use a different one.',
    chatHitDelay: 'Chat slower, you\'ve hit the delay limit',
    // Reseller
    resellerstore: '',
    resellerstoreWebhookLink: '',
    sellappwebhooksecret: '',
    sellappdayproduct: '',
    sellappweekproduct: '',
    sellappmonthproduct: '',
    sellapplifetimeproduct: '',
    // Customer Panel
    panelstatus: '1',
    customerPanelLink: '',
    customerPanelIcon: 'https://cdn.keyauth.cc/front/assets/img/favicon.png',
    // Function toggles
    functionValue: 1048575,
  }

  return (
    <div className="min-h-screen relative z-10" suppressHydrationWarning>
      <Sidebar user={user} showAppNav={apps.length > 0} />
      <MobileSidebar user={user} showAppNav={apps.length > 0} />
      <AppSettingsContent user={user} apps={apps} appSettings={appSettings} currentAppId={selectedAppId} />
    </div>
  )
}

