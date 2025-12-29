'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { useToast } from '@/components/ui/Toast'

interface AppSettingsContentProps {
  user: {
    name?: string | null
    email: string
  }
  apps: { id: string; name: string }[]
  appSettings: any
  currentAppId: string | null
}

export const AppSettingsContent: React.FC<AppSettingsContentProps> = ({
  user,
  apps,
  appSettings: initialSettings,
  currentAppId,
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const [appSettings, setAppSettings] = useState(initialSettings)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(currentAppId || apps[0]?.id || null)
  const [activeTab, setActiveTab] = useState('appsettings')
  const [showAddDomainModal, setShowAddDomainModal] = useState(false)
  const [showAddHashModal, setShowAddHashModal] = useState(false)
  const [showResetHashModal, setShowResetHashModal] = useState(false)
  const [newHash, setNewHash] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPopovers, setShowPopovers] = useState<Record<string, boolean>>({})
  
  // Function toggles state - using bitmask values
  const [functionToggles, setFunctionToggles] = useState<Record<string, boolean>>({
    loginToggle: true,
    registerToggle: true,
    licenseToggle: true,
    upgradeToggle: true,
    chatSendToggle: true,
    chatGetToggle: true,
    getVarToggle: true,
    setVarToggle: true,
    varToggle: true,
    banToggle: true,
    checkBlackToggle: true,
    sessionToggle: true,
    changeUsernameToggle: true,
    fileToggle: true,
    fetchOnlineToggle: true,
    forgotPasswordToggle: true,
    fetchStatsToggle: true,
    logToggle: true,
    webhookToggle: true,
    tfaToggle: true,
  })

  const currentApp = apps.find((a) => a.id === selectedAppId) || apps[0]

  const handleAppChange = async (appId: string) => {
    setSelectedAppId(appId)
    try {
      await fetch('/api/apps/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      })
      router.push('/dashboard/app-settings')
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to select app',
        description: e?.message || 'Something went wrong while selecting your app.',
      })
    }
  }

  const handleSettingChange = (field: string, value: any) => {
    setAppSettings((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Function toggle bit positions (based on KeyAuth function values)
  const functionBits: Record<string, number> = {
    loginToggle: 0,
    registerToggle: 1,
    licenseToggle: 2,
    upgradeToggle: 3,
    chatSendToggle: 4,
    chatGetToggle: 5,
    getVarToggle: 6,
    setVarToggle: 7,
    varToggle: 8,
    banToggle: 9,
    checkBlackToggle: 10,
    sessionToggle: 11,
    changeUsernameToggle: 12,
    fileToggle: 13,
    fetchOnlineToggle: 14,
    forgotPasswordToggle: 15,
    fetchStatsToggle: 16,
    logToggle: 17,
    webhookToggle: 18,
    tfaToggle: 19,
  }

  const calculateFunctionValue = (toggles: Record<string, boolean>): number => {
    let value = 0
    Object.entries(toggles).forEach(([key, enabled]) => {
      if (enabled && functionBits[key] !== undefined) {
        value |= 1 << functionBits[key]
      }
    })
    return value
  }

  const handleFunctionToggle = (key: string, checked: boolean) => {
    setFunctionToggles((prev) => {
      const updated = { ...prev, [key]: checked }
      const functionValue = calculateFunctionValue(updated)
      handleSettingChange('functionValue', functionValue)
      return updated
    })
  }

  const handleToggleAll = (checked: boolean) => {
    const allToggles: Record<string, boolean> = {}
    Object.keys(functionToggles).forEach((key) => {
      allToggles[key] = checked
    })
    setFunctionToggles(allToggles)
    const functionValue = calculateFunctionValue(allToggles)
    handleSettingChange('functionValue', functionValue)
  }

  const allToggled = Object.values(functionToggles).every((v) => v)

  // Initialize function toggles from functionValue on mount
  useEffect(() => {
    if (appSettings.functionValue !== undefined) {
      const value = appSettings.functionValue
      const toggles: Record<string, boolean> = {}
      Object.entries(functionBits).forEach(([key, bit]) => {
        toggles[key] = (value & (1 << bit)) !== 0
      })
      setFunctionToggles(toggles)
    }
  }, [appSettings.functionValue])

  const handleSave = async () => {
    if (!selectedAppId) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/apps/${selectedAppId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appSettings),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to save settings')

      toast({
        variant: 'success',
        title: 'Settings saved',
        description: 'Your application settings have been saved successfully.',
      })

      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to save settings',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddHash = async () => {
    if (!selectedAppId || !newHash.trim()) {
      toast({
        variant: 'warning',
        title: 'Enter a hash',
        description: 'Please provide a hash value to add.',
      })
      return
    }

    try {
      const res = await fetch(`/api/apps/${selectedAppId}/hashes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: newHash.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to add hash')

      toast({
        variant: 'success',
        title: 'Hash added',
        description: 'The additional hash has been added successfully.',
      })

      setNewHash('')
      setShowAddHashModal(false)
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to add hash',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleResetHashes = async () => {
    if (!selectedAppId) return

    try {
      const res = await fetch(`/api/apps/${selectedAppId}/hashes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to reset hashes')

      toast({
        variant: 'success',
        title: 'Hashes reset',
        description: 'All program hashes have been reset successfully.',
      })

      setShowResetHashModal(false)
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to reset hashes',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppId || !newDomain.trim()) {
      toast({
        variant: 'warning',
        title: 'Enter a domain',
        description: 'Please provide a domain value to add.',
      })
      return
    }

    try {
      const res = await fetch(`/api/apps/${selectedAppId}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to add domain')

      toast({
        variant: 'success',
        title: 'Domain added',
        description: 'The custom domain has been added successfully.',
      })

      setNewDomain('')
      setShowAddDomainModal(false)
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to add domain',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const togglePopover = (id: string) => {
    setShowPopovers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const Popover = ({
    id,
    title,
    description,
    children,
  }: {
    id: string
    title: string
    description: string
    children: React.ReactNode
  }) => {
    const [isVisible, setIsVisible] = useState(false)
    const popoverRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
          setIsVisible(false)
        }
      }

      if (isVisible) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isVisible])

    return (
      <div className="relative" ref={popoverRef}>
        <div
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          onFocus={() => setIsVisible(true)}
          onBlur={() => setIsVisible(false)}
        >
          {children}
        </div>
        {isVisible && (
          <div
            id={`${id}-popover`}
            role="tooltip"
            className="absolute z-10 inline-block w-64 text-sm glass-card border border-black/20 dark:border-white/20 rounded-xl shadow-2xl animate-scale-in"
            style={{ bottom: '100%', left: 0, marginBottom: '8px' }}
          >
            <div className="px-3 py-2 border-b border-black/10 dark:border-white/10 bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/5 rounded-t-xl">
              <h3 className="font-semibold text-black dark:text-white">{title}</h3>
            </div>
            <div className="px-3 py-2">
              <p className="text-black/70 dark:text-white/70">{description}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 transition-all duration-200 lg:ml-72">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 border border-black/5 dark:border-white/5">
            <nav className="flex mb-4" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-2">
                <li className="inline-flex items-center">
                  <a
                    href="/dashboard"
                    className="inline-flex items-center text-sm font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                  >
                    <svg
                      className="w-3 h-3 mr-2.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                    </svg>
                    Dashboard
                  </a>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="mx-2 text-black/40 dark:text-white/40">/</span>
                    <span className="text-sm font-medium text-black/60 dark:text-white/60">
                      Current App: {currentApp?.name || 'None'}
                    </span>
                  </div>
                </li>
              </ol>
            </nav>

            <h1 className="text-xl font-semibold text-black dark:text-white sm:text-2xl mb-2">
              App Settings
            </h1>
            <p className="text-xs text-black/60 dark:text-white/60">
              Configure your application settings and preferences.
            </p>
          </div>

          {/* Settings Content */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 border border-black/5 dark:border-white/5">

            {/* Tabs */}
            <div className="border-b border-black/10 dark:border-white/10 mb-6">
              <ul className="flex flex-wrap gap-1 text-sm font-medium">
                <li>
                  <button
                    onClick={() => setActiveTab('appsettings')}
                    className={`px-4 py-3 rounded-t-lg transition-all duration-200 font-semibold ${
                      activeTab === 'appsettings'
                        ? 'text-black dark:text-white bg-black/5 dark:bg-white/5 border-b-2 border-black dark:border-white'
                        : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Application Function
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('messages')}
                    className={`px-4 py-3 rounded-t-lg transition-all duration-200 font-semibold ${
                      activeTab === 'messages'
                        ? 'text-black dark:text-white bg-black/5 dark:bg-white/5 border-b-2 border-black dark:border-white'
                        : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Alert Messages
                  </button>
                </li>
                <li className="flex items-center">
                  <div className="h-6 w-px bg-black/20 dark:bg-white/20 mx-2"></div>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('storesettings')}
                    className={`px-4 py-3 rounded-t-lg transition-all duration-200 font-semibold ${
                      activeTab === 'storesettings'
                        ? 'text-black dark:text-white bg-black/5 dark:bg-white/5 border-b-2 border-black dark:border-white'
                        : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Reseller
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('customerPanelSettings')}
                    className={`px-4 py-3 rounded-t-lg transition-all duration-200 font-semibold ${
                      activeTab === 'customerPanelSettings'
                        ? 'text-black dark:text-white bg-black/5 dark:bg-white/5 border-b-2 border-black dark:border-white'
                        : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Customer Panel
                  </button>
                </li>
                <li className="flex items-center">
                  <div className="h-6 w-px bg-black/20 dark:bg-white/20 mx-2"></div>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('hashsettings')}
                    className={`px-4 py-3 rounded-t-lg transition-all duration-200 font-semibold ${
                      activeTab === 'hashsettings'
                        ? 'text-black dark:text-white bg-black/5 dark:bg-white/5 border-b-2 border-black dark:border-white'
                        : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Hash Settings
                  </button>
                </li>
                <li className="flex items-center">
                  <div className="h-6 w-px bg-black/20 dark:bg-white/20 mx-2"></div>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('appFunctionToggle')}
                    className={`px-4 py-3 rounded-t-lg transition-all duration-200 font-semibold ${
                      activeTab === 'appFunctionToggle'
                        ? 'text-black dark:text-white bg-black/5 dark:bg-white/5 border-b-2 border-black dark:border-white'
                        : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    Function Management
                  </button>
                </li>
              </ul>
            </div>

            {/* Tab Content */}
            <div
              id="appsettings"
              role="tabpanel"
              aria-labelledby="appsettings-tab"
              className={`grid gap-7 ${activeTab === 'appsettings' ? '' : 'hidden'}`}
            >
              <Button
                variant="secondary"
                onClick={() => setShowAddDomainModal(true)}
                className="flex items-center gap-2 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Custom domain
              </Button>

              <div className="grid grid-cols-1 lg:grid-cols-4 2xl:grid-cols-8">
                {/* App Status */}
                <div className="mb-4" style={{ marginRight: '10px' }}>
                  <Popover
                    id="status"
                    title="App Status"
                    description="Allow users to open your app or not."
                  >
                    <Select
                      label="App Status"
                      id="statusinput"
                      name="statusinput"
                      value={appSettings.status || '1'}
                      onChange={(value) => handleSettingChange('status', value)}
                    >
                      <option value="0">Disabled</option>
                      <option value="1">Enabled</option>
                    </Select>
                  </Popover>
                </div>

                {/* HWID Lock */}
                <div className="mb-4" style={{ marginRight: '10px' }}>
                  <Popover
                    id="hwidlock"
                    title="HWID Lock"
                    description="Lock users to a value from your user's computer which only changes if they reinstall windows. Use this to prevent people from sharing your product."
                  >
                    <Select
                      label="HWID Lock"
                      id="hwidinput"
                      name="hwidinput"
                      value={appSettings.hwidLock || '1'}
                      onChange={(value) => handleSettingChange('hwidLock', value)}
                    >
                      <option value="0">Disabled</option>
                      <option value="1">Enabled</option>
                    </Select>
                  </Popover>
                </div>

                {/* Force HWID */}
                <div className="mb-4" style={{ marginRight: '10px' }}>
                  <Popover
                    id="forceHwid"
                    title="Force HWID"
                    description="Prevent users from logging in with a blank HWID (disable this for PHP)"
                  >
                    <Select
                      label="Force HWID"
                      id="forceHwid"
                      name="forceHwid"
                      value={appSettings.forceHwid || '1'}
                      onChange={(value) => handleSettingChange('forceHwid', value)}
                    >
                      <option value="0">Disabled</option>
                      <option value="1">Enabled</option>
                    </Select>
                  </Popover>
                </div>

                {/* VPN Block */}
                <div className="mb-4" style={{ marginRight: '10px' }}>
                  <Popover
                    id="vpnblock"
                    title="VPN"
                    description="Block IP addresses associated with VPNs"
                  >
                    <Select
                      label="VPN Block"
                      id="vpninput"
                      name="vpninput"
                      value={appSettings.vpnBlock || '0'}
                      onChange={(value) => handleSettingChange('vpnBlock', value)}
                    >
                      <option value="0">Disabled</option>
                      <option value="1">Enabled</option>
                    </Select>
                  </Popover>
                </div>

                {/* Hash Check */}
                <div className="mb-4" style={{ marginRight: '10px' }}>
                  <Popover
                    id="hashCheck"
                    title="Hash Check"
                    description="Checks whether the application has been modified since the last time you pressed the reset hash button. Used to prevent people from altering/bypassing your app."
                  >
                    <Select
                      label="Hash Check"
                      id="hashinput"
                      name="hashinput"
                      value={appSettings.hashCheck || '0'}
                      onChange={(value) => handleSettingChange('hashCheck', value)}
                    >
                      <option value="0">Disabled</option>
                      <option value="1">Enabled</option>
                    </Select>
                  </Popover>
                </div>

                {/* Block Leaked Passwords */}
                <div className="mb-4" style={{ marginRight: '10px' }}>
                  <Popover
                    id="blockLeakedPW"
                    title="Block Leaked Passwords"
                    description="Prevent users from using leaked passwords when registering an account."
                  >
                    <Select
                      label="Block Leaked PW"
                      id="blockLeakedPasswords"
                      name="blockLeakedPasswords"
                      value={appSettings.blockLeakedPasswords || '0'}
                      onChange={(value) => handleSettingChange('blockLeakedPasswords', value)}
                    >
                      <option value="0">Disabled</option>
                      <option value="1">Enabled</option>
                    </Select>
                  </Popover>
                </div>

                {/* Token Validation */}
                <div className="mb-4" style={{ marginRight: '10px' }}>
                  <Popover
                    id="tokeninput"
                    title="Token Validation"
                    description="Checks to see if a user has a valid token to use your application."
                  >
                    <Select
                      label="Token Validation"
                      id="tokeninput"
                      name="tokeninput"
                      value={appSettings.tokenValidation || '0'}
                      onChange={(value) => handleSettingChange('tokenValidation', value)}
                    >
                      <option value="0">Disabled</option>
                      <option value="1">Enabled</option>
                    </Select>
                  </Popover>
                </div>
              </div>

              {/* Minimum HWID Length */}
              <Popover
                id="minHwid"
                title="Minimum HWID Length"
                description="Prevents users from logging in with a shorter HWID than the assigned value."
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  name="minHwid"
                  id="minHwid"
                  max={999}
                  value={String(appSettings.minHwid || 20)}
                  onChange={(e) => handleSettingChange('minHwid', parseInt(e.target.value) || 20)}
                  label="Minimum HWID Length"
                />
              </Popover>

              {/* Application Version */}
              <Popover
                id="version"
                title="Version"
                description="The version of your application. Make sure to change it in your application as well."
              >
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  name="version"
                  id="version"
                  value={appSettings.version || '1.0'}
                  onChange={(e) => handleSettingChange('version', e.target.value)}
                  required
                  label="Application Version"
                />
              </Popover>

              {/* Auto-Update Download Link */}
              <Popover
                id="download"
                title="Download Link"
                description="This is the link that will open if the version is different than the one in your application. (AKA auto-update)."
              >
                <Input
                  type="url"
                  maxLength={120}
                  name="download"
                  id="download"
                  value={appSettings.download || ''}
                  onChange={(e) => handleSettingChange('download', e.target.value)}
                  placeholder="https://example.com/download"
                  label="Auto-Update Download Link"
                />
              </Popover>

              {/* Webloader Download Link */}
              <Popover
                id="webDownload"
                title="Web Downloader"
                description="URL link for the web loader. (this will enable the web loader if it is not empty)"
              >
                <Input
                  type="url"
                  name="webdownload"
                  id="webdownload"
                  value={appSettings.webdownload || ''}
                  onChange={(e) => handleSettingChange('webdownload', e.target.value)}
                  placeholder="https://example.com/webdownload"
                  label="Webloader Download Link"
                />
              </Popover>

              {/* Discord Webhook Link */}
              <Popover
                id="webhook"
                title="Webhook"
                description="Receive secure Discord webhooks for logs/activity."
              >
                <Input
                  type="text"
                  name="webhook"
                  id="webhook"
                  value={appSettings.webhook || ''}
                  onChange={(e) => handleSettingChange('webhook', e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  label="Discord Webhook Link"
                />
              </Popover>

              {/* Show IPs on Discord */}
              <div>
                <Popover
                  id="ipLogging"
                  title="Show IPs"
                  description="Disable if you don't want IPs visible in Discord webhook logs"
                >
                  <Select
                    label="Show IPs on Discord"
                    id="ipLogging"
                    name="ipLogging"
                    value={appSettings.ipLogging || '1'}
                    onChange={(value) => handleSettingChange('ipLogging', value)}
                  >
                    <option value="0">Disabled</option>
                    <option value="1">Enabled</option>
                  </Select>
                </Popover>
              </div>

              {/* HWID Reset Cooldown Unit */}
              <div>
                <Popover
                  id="cooldownExpiry"
                  title="HWID Reset Cooldown (unit)"
                  description="The unit before a user can HWID reset again."
                >
                  <Select
                    label="HWID Reset Cooldown Unit"
                    id="cooldownexpiry"
                    name="cooldownexpiry"
                    value={appSettings.cooldownexpiry || '86400'}
                    onChange={(value) => handleSettingChange('cooldownexpiry', value)}
                  >
                    <option value="1">Seconds</option>
                    <option value="60">Minutes</option>
                    <option value="3600">Hours</option>
                    <option value="86400">Days</option>
                    <option value="604800">Weeks</option>
                    <option value="2629743">Months</option>
                    <option value="31556926">Years</option>
                    <option value="315569260">Lifetime</option>
                  </Select>
                </Popover>
              </div>

              {/* HWID Reset Cooldown Duration */}
              <Popover
                id="cooldownDuration"
                title="HWID Reset Cooldown (duration)"
                description="The duration before a user can HWID reset again. (Unit * Duration = cooldown)"
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  name="cooldownduration"
                  max={999}
                  id="cooldownduration"
                  value={String(appSettings.cooldownduration || 7)}
                  onChange={(e) => handleSettingChange('cooldownduration', parseInt(e.target.value) || 7)}
                  label="HWID Reset Cooldown Duration"
                />
              </Popover>

              {/* Session Expiry Unit */}
              <div>
                <Popover
                  id="sessionExpiry"
                  title="Session Expiry (unit)"
                  description="The unit before the users session expires (logs out)"
                >
                  <Select
                    label="Session Expiry Unit"
                    id="sessionexpiry"
                    name="sessionexpiry"
                    value={appSettings.sessionexpiry || '3600'}
                    onChange={(value) => handleSettingChange('sessionexpiry', value)}
                  >
                    <option value="1">Seconds</option>
                    <option value="60">Minutes</option>
                    <option value="3600">Hours</option>
                    <option value="86400">Days</option>
                    <option value="604800">Weeks</option>
                  </Select>
                </Popover>
              </div>

              {/* Session Expiry Duration */}
              <Popover
                id="sessionDuration"
                title="Session Expiry (duration)"
                description="The duration before the users session expires (logs out. Unit * Duration = expiry)"
              >
                <Input
                  type="text"
                  inputMode="numeric"
                  name="sessionduration"
                  id="sessionduration"
                  value={appSettings.sessionduration || 6}
                  onChange={(e) => handleSettingChange('sessionduration', e.target.value)}
                  required
                  label="Session Expiry Duration"
                />
              </Popover>

              {/* Minimum Username Length */}
              <Popover
                id="minUsernameLength"
                title="Minimum Username Length"
                description="Prevents users from creating an account with a username less than the given value."
              >
                <Input
                  type="text"
                  inputMode="numeric"
                  name="minUsernameLength"
                  id="minUsernameLength"
                  value={appSettings.minUsernameLength || 1}
                  onChange={(e) => handleSettingChange('minUsernameLength', e.target.value)}
                  required
                  label="Minimum username length"
                />
              </Popover>

              {/* Update App Settings Button */}
              <div className="flex justify-end mt-4">
                <Button
                  variant="secondary"
                  onClick={handleSave}
                  disabled={isSaving}
                  isLoading={isSaving}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {isSaving ? 'Saving...' : 'Update App Settings'}
                </Button>
              </div>
            </div>

            {/* Hash Settings Tab Content */}
            <div
              id="hashsettings"
              role="tabpanel"
              aria-labelledby="hashsettings-tab"
              className={`grid gap-4 ${activeTab === 'hashsettings' ? '' : 'hidden'}`}
            >
              {/* Hash Settings Section */}
              <div className="flex flex-wrap gap-3 mb-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowAddHashModal(true)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Additional Hash
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowResetHashModal(true)}
                  className="flex items-center gap-2 !bg-red-500/10 hover:!bg-red-500/20 !text-red-600 dark:!text-red-400 !border-red-500/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset All Hashes
                </Button>
              </div>

              {/* Update App Settings Button */}
              <div className="flex justify-end mt-4">
                <Button
                  variant="secondary"
                  onClick={handleSave}
                  disabled={isSaving}
                  isLoading={isSaving}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {isSaving ? 'Saving...' : 'Update App Settings'}
                </Button>
              </div>
            </div>

            {/* Alert Messages Tab Content */}
            <div
              id="messages"
              role="tabpanel"
              aria-labelledby="messages-tab"
              className={`grid gap-4 ${activeTab === 'messages' ? '' : 'hidden'}`}
            >
              {/* Alert Box */}
              <div className="flex items-center p-4 mb-4 text-red-600 dark:text-red-400 rounded-xl bg-red-500/10 dark:bg-red-500/10 border border-red-500/30" role="alert">
                <svg className="flex-shrink-0 w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                </svg>
                <div className="ml-3 text-sm font-medium">
                  It&apos;s <b>highly</b> recommended to change these to something custom!
                </div>
              </div>
              {/* End Alert Box */}

              {/* Application Disabled Message */}
              <Input
                type="text"
                maxLength={100}
                name="appdisabled"
                id="appdisabled"
                value={appSettings.appdisabled || 'This application is disabled'}
                onChange={(e) => handleSettingChange('appdisabled', e.target.value)}
                autoComplete="on"
                required
                label="Application Disabled Message"
              />

              {/* Token Validation Message */}
              <Input
                type="text"
                maxLength={100}
                name="tokeninvalid"
                id="tokeninvalid"
                value={appSettings.tokeninvalid || 'Please provide a valid token for you to proceed'}
                onChange={(e) => handleSettingChange('tokeninvalid', e.target.value)}
                autoComplete="on"
                required
                label="Token Validation Message"
              />

              {/* Mismatch Program Hash Message */}
              <Input
                type="text"
                maxLength={100}
                name="hashcheckfail"
                id="hashcheckfail"
                value={appSettings.hashcheckfail || "This program hash does not match, make sure you're using latest version"}
                onChange={(e) => handleSettingChange('hashcheckfail', e.target.value)}
                autoComplete="on"
                required
                label="Mismatch Program Hash Message"
              />

              {/* VPNs are blocked on this application */}
              <Input
                type="text"
                maxLength={100}
                name="vpnblocked"
                id="vpnblocked"
                value={appSettings.vpnblocked || 'VPNs are blocked on this application'}
                onChange={(e) => handleSettingChange('vpnblocked', e.target.value)}
                autoComplete="on"
                required
                label="VPNs are blocked on this application"
              />

              {/* Username already taken, choose a different one */}
              <Input
                type="text"
                maxLength={100}
                name="usernametaken"
                id="usernametaken"
                value={appSettings.usernametaken || 'Username already taken, choose a different one'}
                onChange={(e) => handleSettingChange('usernametaken', e.target.value)}
                autoComplete="on"
                required
                label="Username already taken, choose a different one"
              />

              {/* Invalid license key */}
              <Input
                type="text"
                maxLength={100}
                name="keynotfound"
                id="keynotfound"
                value={appSettings.keynotfound || 'Invalid license key'}
                onChange={(e) => handleSettingChange('keynotfound', e.target.value)}
                autoComplete="on"
                required
                label="Invalid license key"
              />

              {/* License key has already been used */}
              <Input
                type="text"
                maxLength={100}
                name="keyused"
                id="keyused"
                value={appSettings.keyused || 'License key has already been used'}
                onChange={(e) => handleSettingChange('keyused', e.target.value)}
                autoComplete="on"
                required
                label="License key has already been used"
              />

              {/* Your license is banned */}
              <Input
                type="text"
                maxLength={100}
                name="keybanned"
                id="keybanned"
                value={appSettings.keybanned || 'Your license is banned'}
                onChange={(e) => handleSettingChange('keybanned', e.target.value)}
                autoComplete="on"
                required
                label="Your license is banned"
              />

              {/* There is no subscription created for your key level */}
              <Input
                type="text"
                maxLength={100}
                name="nosublevel"
                id="nosublevel"
                value={appSettings.nosublevel || 'There is no subscription created for your key level. Contact application developer.'}
                onChange={(e) => handleSettingChange('nosublevel', e.target.value)}
                autoComplete="on"
                required
                label="There is no subscription created for your key level. Contact application developer."
              />

              {/* The user is banned */}
              <Input
                type="text"
                maxLength={100}
                name="userbanned"
                id="userbanned"
                value={appSettings.userbanned || 'The user is banned'}
                onChange={(e) => handleSettingChange('userbanned', e.target.value)}
                autoComplete="on"
                required
                label="The user is banned"
              />

              {/* Username doesn't exist */}
              <Input
                type="text"
                maxLength={100}
                name="usernamenotfound"
                id="usernamenotfound"
                value={appSettings.usernamenotfound || 'Invalid username'}
                onChange={(e) => handleSettingChange('usernamenotfound', e.target.value)}
                autoComplete="on"
                required
                label="Username doesn't exist"
              />

              {/* Password does not match */}
              <Input
                type="text"
                maxLength={100}
                name="passmismatch"
                id="passmismatch"
                value={appSettings.passmismatch || 'Password does not match.'}
                onChange={(e) => handleSettingChange('passmismatch', e.target.value)}
                autoComplete="on"
                required
                label="Password does not match."
              />

              {/* HWID doesn't match */}
              <Input
                type="text"
                maxLength={100}
                name="hwidmismatch"
                id="hwidmismatch"
                value={appSettings.hwidmismatch || "HWID doesn't match. Ask for a HWID reset"}
                onChange={(e) => handleSettingChange('hwidmismatch', e.target.value)}
                autoComplete="on"
                required
                label="HWID doesn't match. Ask for a HWID reset"
              />

              {/* No active subscription(s) found */}
              <Input
                type="text"
                maxLength={100}
                name="noactivesubs"
                id="noactivesubs"
                value={appSettings.noactivesubs || 'No active subscription(s) found'}
                onChange={(e) => handleSettingChange('noactivesubs', e.target.value)}
                autoComplete="on"
                required
                label="No active subscription(s) found"
              />

              {/* You've been blacklisted */}
              <Input
                type="text"
                maxLength={100}
                name="hwidblacked"
                id="hwidblacked"
                value={appSettings.hwidblacked || "You've been blacklisted from our application"}
                onChange={(e) => handleSettingChange('hwidblacked', e.target.value)}
                autoComplete="on"
                required
                label="You've been blacklisted from our application"
              />

              {/* Your subscription is paused */}
              <Input
                type="text"
                maxLength={100}
                name="pausedsub"
                id="pausedsub"
                value={appSettings.pausedsub || "Your subscription is paused and can't be used right now"}
                onChange={(e) => handleSettingChange('pausedsub', e.target.value)}
                autoComplete="on"
                required
                label="Your subscription is paused and can't be used right now"
              />

              {/* Session is not validated */}
              <Input
                type="text"
                maxLength={100}
                name="sessionunauthed"
                id="sessionunauthed"
                value={appSettings.sessionunauthed || 'Session is not validated'}
                onChange={(e) => handleSettingChange('sessionunauthed', e.target.value)}
                autoComplete="on"
                required
                label="Session is not validated"
              />

              {/* Logged in! */}
              <Input
                type="text"
                maxLength={100}
                name="loggedInMsg"
                id="loggedInMsg"
                value={appSettings.loggedInMsg || 'Logged in!'}
                onChange={(e) => handleSettingChange('loggedInMsg', e.target.value)}
                autoComplete="on"
                required
                label="Logged in!"
              />

              {/* Application is currently paused */}
              <Input
                type="text"
                maxLength={100}
                name="pausedApp"
                id="pausedApp"
                value={appSettings.pausedApp || 'Application is currently paused, please wait for the developer to say otherwise.'}
                onChange={(e) => handleSettingChange('pausedApp', e.target.value)}
                autoComplete="on"
                required
                label="Application is currently paused, please wait for the developer to say otherwise."
              />

              {/* Username too short */}
              <Input
                type="text"
                maxLength={100}
                name="unTooShort"
                id="unTooShort"
                value={appSettings.unTooShort || 'Username too short, try longer one.'}
                onChange={(e) => handleSettingChange('unTooShort', e.target.value)}
                autoComplete="on"
                required
                label="Username too short, try longer one."
              />

              {/* Password leaked */}
              <Input
                type="text"
                maxLength={100}
                name="pwLeaked"
                id="pwLeaked"
                value={appSettings.pwLeaked || 'This password has been leaked in a data breach (not from us), please use a different one.'}
                onChange={(e) => handleSettingChange('pwLeaked', e.target.value)}
                autoComplete="on"
                required
                label="This password has been leaked in a data breach (not from us), please use a different one."
              />

              {/* Chat slower, you've hit the delay limit */}
              <Input
                type="text"
                maxLength={100}
                name="chatHitDelay"
                id="chatHitDelay"
                value={appSettings.chatHitDelay || "Chat slower, you've hit the delay limit"}
                onChange={(e) => handleSettingChange('chatHitDelay', e.target.value)}
                autoComplete="on"
                required
                label="Chat slower, you've hit the delay limit"
              />

              {/* Save Button */}
              <div className="flex justify-end mt-4">
                <Button
                  variant="secondary"
                  onClick={handleSave}
                  disabled={isSaving}
                  isLoading={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>

            {/* Reseller Tab Content */}
            <div
              id="storesettings"
              role="tabpanel"
              aria-labelledby="storesettings-tab"
              className={`grid gap-4 ${activeTab === 'storesettings' ? '' : 'hidden'}`}
            >
              {/* Connect SellSN Button (Disabled) */}
              <a
                className="hover:cursor-not-allowed flex inline-flex text-white bg-green-700 hover:opacity-60 focus:ring-0 font-medium rounded-lg text-sm px-5 py-2.5 transition duration-200 opacity-50 pointer-events-none"
                href="https://dash.sellsn.io/link/keyauth"
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled="true"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                Connect SellSN (discontinued - SellSN has stated they are shutting down)
              </a>

              {/* Alert Box */}
              <div className="flex items-center p-4 mb-4 text-blue-600 dark:text-blue-400 rounded-xl bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/30" role="alert">
                <svg className="flex-shrink-0 w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                </svg>
                <div className="ml-3 text-sm font-medium">
                  View our{' '}
                  <b>
                    <u>
                      <a href="https://www.youtube.com/watch?v=wAtTwBxPdmU" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        YouTube video here
                      </a>
                    </u>
                  </b>{' '}
                  to use reseller system.
                </div>
              </div>
              {/* End Alert Box */}

              {/* Reseller Store Link */}
              <Popover
                id="resellerstore"
                title="Reseller Store Link"
                description="If you're not using built-in reseller system, set a link will show to your resellers for them to buy keys."
              >
                <Input
                  type="text"
                  id="resellerstore"
                  name="resellerstore"
                  value={appSettings.resellerstore || ''}
                  onChange={(e) => handleSettingChange('resellerstore', e.target.value)}
                  placeholder="https://example.com/store"
                  label="Reseller Store Link"
                />
              </Popover>

              {/* Reseller Webhook Link */}
              <Popover
                id="resellerstoreWebhookLink"
                title="Reseller Webhook Link"
                description="This is the same if you're using Sellix or Shoppy, create webhook with this link for the event order:paid"
              >
                <Input
                  type="url"
                  id="resellerstoreWebhookLink"
                  name="resellerstoreWebhookLink"
                  value={appSettings.resellerstoreWebhookLink || ''}
                  onChange={(e) => handleSettingChange('resellerstoreWebhookLink', e.target.value)}
                  placeholder="https://..."
                  label="Reseller Webhook Link"
                  disabled
                />
              </Popover>

              {/* Sellapp Section */}
              <h1 className="text-xl font-semibold text-white-900 sm:text-2xl">Sellapp</h1>

              {/* Sellapp Webhook Secret */}
              <Popover
                id="sellappwebhooksecret"
                title="Sell App Webhook Secret"
                description="SellApp webhook secret for reseller system."
              >
                <Input
                  type="text"
                  id="sellappwebhooksecret"
                  name="sellappwebhooksecret"
                  value={appSettings.sellappwebhooksecret || ''}
                  onChange={(e) => handleSettingChange('sellappwebhooksecret', e.target.value)}
                  maxLength={64}
                  placeholder="Enter webhook secret"
                  label="Sellapp Webhook Secret"
                />
              </Popover>

              {/* Sellapp Day Product ID */}
              <Input
                type="text"
                id="sellappdayproduct"
                name="sellappdayproduct"
                value={appSettings.sellappdayproduct || ''}
                onChange={(e) => handleSettingChange('sellappdayproduct', e.target.value)}
                placeholder="Enter product ID"
                label="Sellapp Day Product ID"
              />

              {/* Sellapp Week Product ID */}
              <Input
                type="text"
                id="sellappweekproduct"
                name="sellappweekproduct"
                value={appSettings.sellappweekproduct || ''}
                onChange={(e) => handleSettingChange('sellappweekproduct', e.target.value)}
                placeholder="Enter product ID"
                label="Sellapp Week Product ID"
              />

              {/* Sellapp Month Product ID */}
              <Input
                type="text"
                id="sellappmonthproduct"
                name="sellappmonthproduct"
                value={appSettings.sellappmonthproduct || ''}
                onChange={(e) => handleSettingChange('sellappmonthproduct', e.target.value)}
                placeholder="Enter product ID"
                label="Sellapp Month Product ID"
              />

              {/* Sellapp Lifetime Product ID */}
              <Input
                type="text"
                id="sellapplifetimeproduct"
                name="sellapplifetimeproduct"
                value={appSettings.sellapplifetimeproduct || ''}
                onChange={(e) => handleSettingChange('sellapplifetimeproduct', e.target.value)}
                placeholder="Enter product ID"
                label="Sellapp Lifetime Product ID"
              />

              {/* Save Button */}
              <div className="flex justify-end mt-4">
                <Button
                  variant="secondary"
                  onClick={handleSave}
                  disabled={isSaving}
                  isLoading={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>

            {/* Customer Panel Settings Tab Content */}
            <div
              id="customerPanelSettings"
              role="tabpanel"
              aria-labelledby="customerPanelSettings-tab"
              className={`grid gap-4 ${activeTab === 'customerPanelSettings' ? '' : 'hidden'}`}
            >
              {/* Add Custom Domain Button */}
              <Button
                variant="secondary"
                onClick={() => setShowAddDomainModal(true)}
                className="flex items-center gap-2 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Custom domain
              </Button>

              <div className="grid grid-cols-1 lg:grid-cols-4 2xl:grid-cols-8">
                {/* Customer Panel Status */}
                <div className="mb-4" style={{ marginRight: '10px' }}>
                  <Popover
                    id="customerPanel"
                    title="Customer Panel"
                    description="Allows your users to access a dedicated page just for them to manage their account and download updates/webloader."
                  >
                    <Select
                      label="Customer Panel"
                      id="panelstatus"
                      name="panelstatus"
                      value={appSettings.panelstatus || '1'}
                      onChange={(value) => handleSettingChange('panelstatus', value)}
                    >
                      <option value="0">Disabled</option>
                      <option value="1">Enabled</option>
                    </Select>
                  </Popover>
                </div>
              </div>

              {/* Customer Panel Link */}
              <Popover
                id="customerPanelLink"
                title="Customer Panel Link"
                description="This is the link you will provide to your users if you would like them to have the ability to HWID, and alter their accounts."
              >
                <Input
                  type="text"
                  id="customerPanelLink"
                  value={appSettings.customerPanelLink || ''}
                  readOnly
                  placeholder="Auto-generated link"
                  label="Customer Panel Link"
                />
              </Popover>

              {/* Customer Panel Icon */}
              <Popover
                id="customerPanelIcon"
                title="Customer Panel Icon"
                description="Image shown on SEO and next to the title in the browser tab."
              >
                <Input
                  type="url"
                  id="customerPanelIcon"
                  name="customerPanelIcon"
                  value={appSettings.customerPanelIcon || 'https://cdn.keyauth.cc/front/assets/img/favicon.png'}
                  onChange={(e) => handleSettingChange('customerPanelIcon', e.target.value)}
                  placeholder="https://example.com/icon.png"
                  label="Customer Panel Icon"
                />
              </Popover>

              {/* Save Button */}
              <div className="flex justify-end mt-4">
                <Button
                  variant="secondary"
                  onClick={handleSave}
                  disabled={isSaving}
                  isLoading={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>

            {/* Function Management Tab Content */}
            <div
              id="appFunctionToggle"
              role="tabpanel"
              aria-labelledby="appFunctionToggle-tab"
              className={`grid gap-4 ${activeTab === 'appFunctionToggle' ? '' : 'hidden'}`}
            >
              <div className="mb-4">
                <Checkbox
                  id="allToggle"
                  name="allToggle"
                  checked={allToggled}
                  onChange={(e) => handleToggleAll(e.target.checked)}
                  label="Toggle All Functions"
                />
              </div>

              <div className="grid grid-cols-4 gap-2 mt-20 relative">
                {/* Login/Register Functions */}
                <div>
                  <span className="inline-block bg-black dark:bg-white text-white dark:text-black text-sm font-semibold px-4 py-2 rounded-xl shadow-lg border border-black/20 dark:border-white/20">
                    Login/Register Functions
                  </span>
                  <div className="mb-4 mt-5">
                    <Checkbox
                      id="loginToggle"
                      name="loginToggle"
                      checked={functionToggles.loginToggle}
                      onChange={(e) => handleFunctionToggle('loginToggle', e.target.checked)}
                      label="Login"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="registerToggle"
                      name="registerToggle"
                      checked={functionToggles.registerToggle}
                      onChange={(e) => handleFunctionToggle('registerToggle', e.target.checked)}
                      label="Register"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="licenseToggle"
                      name="licenseToggle"
                      checked={functionToggles.licenseToggle}
                      onChange={(e) => handleFunctionToggle('licenseToggle', e.target.checked)}
                      label="License"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="upgradeToggle"
                      name="upgradeToggle"
                      checked={functionToggles.upgradeToggle}
                      onChange={(e) => handleFunctionToggle('upgradeToggle', e.target.checked)}
                      label="Upgrade"
                    />
                  </div>
                </div>
                {/* End Login/Register Functions */}

                {/* Chatroom Functions */}
                <div>
                  <span className="inline-block bg-black dark:bg-white text-white dark:text-black text-sm font-semibold px-4 py-2 rounded-xl shadow-lg border border-black/20 dark:border-white/20">
                    Chatroom Functions
                  </span>
                  <div className="mb-4 mt-5">
                    <Checkbox
                      id="chatSendToggle"
                      name="chatSendToggle"
                      checked={functionToggles.chatSendToggle}
                      onChange={(e) => handleFunctionToggle('chatSendToggle', e.target.checked)}
                      label="Send Messages"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="chatGetToggle"
                      name="chatGetToggle"
                      checked={functionToggles.chatGetToggle}
                      onChange={(e) => handleFunctionToggle('chatGetToggle', e.target.checked)}
                      label="Retrieve Messages"
                    />
                  </div>
                </div>
                {/* End Chatroom Functions */}

                {/* Variable Functions */}
                <div>
                  <span className="inline-block bg-black dark:bg-white text-white dark:text-black text-sm font-semibold px-4 py-2 rounded-xl shadow-lg border border-black/20 dark:border-white/20">
                    Variable Functions
                  </span>
                  <div className="mb-4 mt-5">
                    <Checkbox
                      id="getVarToggle"
                      name="getVarToggle"
                      checked={functionToggles.getVarToggle}
                      onChange={(e) => handleFunctionToggle('getVarToggle', e.target.checked)}
                      label="Retrieve User Variable"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="setVarToggle"
                      name="setVarToggle"
                      checked={functionToggles.setVarToggle}
                      onChange={(e) => handleFunctionToggle('setVarToggle', e.target.checked)}
                      label="Set User Variable"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="varToggle"
                      name="varToggle"
                      checked={functionToggles.varToggle}
                      onChange={(e) => handleFunctionToggle('varToggle', e.target.checked)}
                      label="Retrieve Global Variable"
                    />
                  </div>
                </div>
                {/* End Variable Functions */}

                {/* Misc Functions */}
                <div>
                  <span className="inline-block bg-black dark:bg-white text-white dark:text-black text-sm font-semibold px-4 py-2 rounded-xl shadow-lg border border-black/20 dark:border-white/20">
                    Misc Functions
                  </span>
                  <div className="mb-4 mt-5">
                    <Checkbox
                      id="banToggle"
                      name="banToggle"
                      checked={functionToggles.banToggle}
                      onChange={(e) => handleFunctionToggle('banToggle', e.target.checked)}
                      label="Ban"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="checkBlackToggle"
                      name="checkBlackToggle"
                      checked={functionToggles.checkBlackToggle}
                      onChange={(e) => handleFunctionToggle('checkBlackToggle', e.target.checked)}
                      label="Check Blackist"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="sessionToggle"
                      name="sessionToggle"
                      checked={functionToggles.sessionToggle}
                      onChange={(e) => handleFunctionToggle('sessionToggle', e.target.checked)}
                      label="Session Check"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="changeUsernameToggle"
                      name="changeUsernameToggle"
                      checked={functionToggles.changeUsernameToggle}
                      onChange={(e) => handleFunctionToggle('changeUsernameToggle', e.target.checked)}
                      label="Change Username"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="fileToggle"
                      name="fileToggle"
                      checked={functionToggles.fileToggle}
                      onChange={(e) => handleFunctionToggle('fileToggle', e.target.checked)}
                      label="File (Download)"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="fetchOnlineToggle"
                      name="fetchOnlineToggle"
                      checked={functionToggles.fetchOnlineToggle}
                      onChange={(e) => handleFunctionToggle('fetchOnlineToggle', e.target.checked)}
                      label="Fetch Online"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="forgotPasswordToggle"
                      name="forgotPasswordToggle"
                      checked={functionToggles.forgotPasswordToggle}
                      onChange={(e) => handleFunctionToggle('forgotPasswordToggle', e.target.checked)}
                      label="Forgot Password"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="fetchStatsToggle"
                      name="fetchStatsToggle"
                      checked={functionToggles.fetchStatsToggle}
                      onChange={(e) => handleFunctionToggle('fetchStatsToggle', e.target.checked)}
                      label="Fetch Stats"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="logToggle"
                      name="logToggle"
                      checked={functionToggles.logToggle}
                      onChange={(e) => handleFunctionToggle('logToggle', e.target.checked)}
                      label="Log"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="webhookToggle"
                      name="webhookToggle"
                      checked={functionToggles.webhookToggle}
                      onChange={(e) => handleFunctionToggle('webhookToggle', e.target.checked)}
                      label="Webhook"
                    />
                  </div>

                  <div className="mb-4">
                    <Checkbox
                      id="tfaToggle"
                      name="tfaToggle"
                      checked={functionToggles.tfaToggle}
                      onChange={(e) => handleFunctionToggle('tfaToggle', e.target.checked)}
                      label="2FA"
                    />
                  </div>
                </div>
                {/* End Misc Functions */}
              </div>

              {/* Update App Settings Button - Bottom Right */}
              <div className="flex justify-end mt-4">
                <Button
                  variant="secondary"
                  onClick={handleSave}
                  disabled={isSaving}
                  isLoading={isSaving}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {isSaving ? 'Saving...' : 'Update App Settings'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Domain Modal */}
      <Modal
        open={showAddDomainModal}
        onClose={() => setShowAddDomainModal(false)}
        title="Add Customer Panel Custom Domain"
      >
        <form className="space-y-4" onSubmit={handleAddDomain} method="POST">
          <Input
            label="Your custom domain"
            type="text"
            id="domain"
            name="domain"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="panel.example.com"
            autoComplete="on"
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddDomainModal(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" name="addDomainPanel">
              Add Domain
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add New Hash Modal */}
      <Modal
        open={showAddHashModal}
        onClose={() => setShowAddHashModal(false)}
        title="Add Application Hash"
      >
        <div className="space-y-4">
          <Input
            label="MD5 Program Hash To Add"
            type="text"
            value={newHash}
            onChange={(e) => setNewHash(e.target.value)}
            placeholder="Enter MD5 hash"
          />

          {/* Separator with "or" */}
          <div className="relative my-4">
            <hr className="h-px bg-black/10 dark:bg-white/10 border-0" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="glass px-3 text-sm text-black/60 dark:text-white/60">or</span>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed glass-input rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-black/40 dark:border-white/40 bg-black/5 dark:bg-white/5' : 'hover:border-black/30 dark:hover:border-white/30'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              const file = e.dataTransfer.files[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (event) => {
                  toast({
                    variant: 'info',
                    title: 'File selected',
                    description: 'File upload functionality needs to be implemented.',
                  })
                }
                reader.readAsArrayBuffer(file)
              }
            }}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.onchange = (e: any) => {
                const file = e.target.files[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    toast({
                      variant: 'info',
                      title: 'File selected',
                      description: 'File upload functionality needs to be implemented.',
                    })
                  }
                  reader.readAsArrayBuffer(file)
                }
              }
              input.click()
            }}
          >
            <svg
              className="mx-auto h-12 w-12 text-black/40 dark:text-white/40"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-black/70 dark:text-white/70">Click to upload or drag and drop</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddHashModal(false)} type="button">
              Cancel
            </Button>
            <Button onClick={handleAddHash} type="button">
              Add Hash
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Program Hash Modal */}
      <Modal
        open={showResetHashModal}
        onClose={() => setShowResetHashModal(false)}
        title="Reset Program Hash"
      >
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-amber-600/10 dark:from-amber-900/30 dark:to-amber-800/30 text-amber-700 dark:text-amber-400 text-sm p-4">
            <p className="font-semibold mb-1">Notice!</p>
            <p className="text-xs opacity-90">
              You&apos;re about to reset your programs hash. This should only be done if you plan on releasing a new version/update. This <b>can NOT</b> be undone.
            </p>
          </div>
          
          <p className="text-sm text-black/70 dark:text-white/70 text-center">
            Are you sure you want to reset your programs hash?
          </p>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowResetHashModal(false)} type="button">
              Cancel
            </Button>
            <Button
              onClick={handleResetHashes}
              className="!bg-red-600 hover:!bg-red-700 dark:!bg-red-600 dark:hover:!bg-red-700 text-white border-red-600"
            >
              Yes, I&apos;m sure
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// Modal Component
const Modal: React.FC<{
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}> = ({ open, onClose, title, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-card no-hover border border-black/20 dark:border-white/20 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/5">
          <h3 className="text-lg font-bold text-black dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 text-lg px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-110"
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  )
}

