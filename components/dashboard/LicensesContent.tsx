'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { useToast } from '@/components/ui/Toast'

interface License {
  id: string
  key: string
  level: number
  duration: number
  expiry: Date | null
  note: string | null
  used: boolean
  usedBy: string | null
  usedOn: Date | null
  banned: boolean
  banReason: string | null
  createdAt: Date
}

interface LicensesContentProps {
  user: {
    name?: string | null
    email: string
  }
  apps: { id: string; name: string }[]
  licenses: License[]
  currentAppId: string | null
}

export const LicensesContent: React.FC<LicensesContentProps> = ({
  user,
  apps,
  licenses: initialLicenses,
  currentAppId,
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [licenses, setLicenses] = useState<License[]>(initialLicenses)
  const [isBusy, setIsBusy] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(currentAppId || apps[0]?.id || null)
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([])

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddTimeModal, setShowAddTimeModal] = useState(false)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [showDeleteUsedModal, setShowDeleteUsedModal] = useState(false)
  const [showDeleteUnusedModal, setShowDeleteUnusedModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [licenseToDelete, setLicenseToDelete] = useState<string | null>(null)
  const [licenseToBan, setLicenseToBan] = useState<string | null>(null)
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null)
  const actionDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Form states
  const [createForm, setCreateForm] = useState({
    amount: '1',
    mask: '******-******-******-******-******-******',
    level: '1',
    duration: '',
    expiryUnit: '86400', // Days
    note: '',
    lowercaseLetters: true,
    uppercaseLetters: true,
  })

  const [addTimeForm, setAddTimeForm] = useState({
    time: '',
    expiryUnit: '1', // Seconds
  })

  const [banForm, setBanForm] = useState({
    reason: '',
  })

  const currentApp = useMemo(() => {
    return apps.find((a) => a.id === selectedAppId) || apps[0]
  }, [apps, selectedAppId])

  const handleAppChange = async (appId: string) => {
    setSelectedAppId(appId)
    // Update selected app in cookie
    try {
      await fetch('/api/apps/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      })
      router.push('/dashboard/licenses')
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to select app',
        description: e?.message || 'Something went wrong while selecting your app.',
      })
    }
  }

  const handleCreateLicenses = async () => {
    if (!selectedAppId) {
      toast({
        variant: 'error',
        title: 'No app selected',
        description: 'Please select an application first.',
      })
      return
    }

    if (!createForm.amount || !createForm.duration) {
      toast({
        variant: 'error',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      })
      return
    }

    setIsBusy(true)
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          amount: createForm.amount,
          mask: createForm.mask,
          level: createForm.level,
          duration: createForm.duration,
          expiryUnit: createForm.expiryUnit,
          note: createForm.note,
          lowercaseLetters: createForm.lowercaseLetters,
          uppercaseLetters: createForm.uppercaseLetters,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create licenses')

      toast({
        variant: 'success',
        title: 'Licenses created',
        description: `Successfully created ${data.count} license(s).`,
      })

      setShowCreateModal(false)
      setCreateForm({
        amount: '1',
        mask: '******-******-******-******-******-******',
        level: '1',
        duration: '',
        expiryUnit: '86400',
        note: '',
        lowercaseLetters: true,
        uppercaseLetters: true,
      })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to create licenses',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleAddTime = async () => {
    if (!selectedAppId || !addTimeForm.time) {
      toast({
        variant: 'error',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      })
      return
    }

    setIsBusy(true)
    try {
      const res = await fetch('/api/licenses/add-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          time: addTimeForm.time,
          expiryUnit: addTimeForm.expiryUnit,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to add time')

      toast({
        variant: 'success',
        title: 'Time added',
        description: `Successfully added time to ${data.updated} unused license(s).`,
      })

      setShowAddTimeModal(false)
      setAddTimeForm({ time: '', expiryUnit: '1' })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to add time',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleDelete = async (type: 'all' | 'used' | 'unused' | 'selected') => {
    if (!selectedAppId) return

    setIsBusy(true)
    try {
      const res = await fetch('/api/licenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          type: type === 'selected' ? undefined : type,
          licenseIds: type === 'selected' ? selectedLicenses : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to delete licenses')

      toast({
        variant: 'success',
        title: 'Licenses deleted',
        description: `Successfully deleted ${data.deleted} license(s).`,
      })

      setShowDeleteAllModal(false)
      setShowDeleteUsedModal(false)
      setShowDeleteUnusedModal(false)
      setShowDeleteModal(false)
      setSelectedLicenses([])
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to delete licenses',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleBan = async () => {
    if (!selectedAppId || !licenseToBan) return

    setIsBusy(true)
    try {
      const res = await fetch('/api/licenses/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          licenseId: licenseToBan,
          reason: banForm.reason,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to ban license')

      toast({
        variant: 'success',
        title: 'License banned',
        description: 'The license has been banned successfully.',
      })

      setShowBanModal(false)
      setLicenseToBan(null)
      setBanForm({ reason: '' })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to ban license',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleExport = () => {
    const data = licenses.map((l) => ({
      key: l.key,
      level: l.level,
      duration: l.duration,
      expiry: l.expiry?.toISOString() || null,
      note: l.note,
      used: l.used,
      usedBy: l.usedBy,
      usedOn: l.usedOn?.toISOString() || null,
      banned: l.banned,
      banReason: l.banReason,
    }))

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `licenses-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      variant: 'success',
      title: 'Licenses exported',
      description: 'Your licenses have been exported successfully.',
    })
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Lifetime'
    return new Date(date).toLocaleString()
  }

  const formatDuration = (seconds: number) => {
    if (seconds >= 315569260) return 'Lifetime'
    if (seconds >= 31556926) return `${Math.floor(seconds / 31556926)} year(s)`
    if (seconds >= 2629743) return `${Math.floor(seconds / 2629743)} month(s)`
    if (seconds >= 604800) return `${Math.floor(seconds / 604800)} week(s)`
    if (seconds >= 86400) return `${Math.floor(seconds / 86400)} day(s)`
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)} hour(s)`
    if (seconds >= 60) return `${Math.floor(seconds / 60)} minute(s)`
    return `${seconds} second(s)`
  }

  // Handle click outside for action dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(actionDropdownRefs.current).forEach(([licenseId, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          if (openActionDropdown === licenseId) {
            setOpenActionDropdown(null)
          }
        }
      })
    }

    if (openActionDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openActionDropdown])

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
              Licenses
            </h1>
            <p className="text-xs text-black/60 dark:text-white/60">
              Licenses allow your users to register on your application.{' '}
              <a
                href="#"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Learn More
              </a>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 border border-black/5 dark:border-white/5">
            <div className="flex flex-wrap gap-3 mb-4">
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(true)}
                isLoading={isBusy}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create A License
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowAddTimeModal(true)}
                isLoading={isBusy}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Add Time To Unused Licenses
              </Button>

              <Button
                variant="secondary"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Licenses
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowDeleteAllModal(true)}
                isLoading={isBusy}
                className="flex items-center gap-2 !bg-red-500/10 hover:!bg-red-500/20 !text-red-600 dark:!text-red-400 !border-red-500/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete All Licenses
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowDeleteUsedModal(true)}
                isLoading={isBusy}
                className="flex items-center gap-2 !bg-red-500/10 hover:!bg-red-500/20 !text-red-600 dark:!text-red-400 !border-red-500/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete All Used Licenses
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowDeleteUnusedModal(true)}
                isLoading={isBusy}
                className="flex items-center gap-2 !bg-red-500/10 hover:!bg-red-500/20 !text-red-600 dark:!text-red-400 !border-red-500/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete All Unused Licenses
              </Button>
            </div>

            {/* Licenses Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Select
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      License
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Creation Date
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Expiry
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Note
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Used On
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Used By
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {licenses.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-black/60 dark:text-white/60">
                        No licenses found. Create your first license to get started.
                      </td>
                    </tr>
                  ) : (
                    licenses.map((license) => (
                      <tr
                        key={license.id}
                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="relative inline-block">
                            <input
                              type="checkbox"
                              checked={selectedLicenses.includes(license.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLicenses([...selectedLicenses, license.id])
                                } else {
                                  setSelectedLicenses(selectedLicenses.filter((id) => id !== license.id))
                                }
                              }}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center cursor-pointer ${
                                selectedLicenses.includes(license.id)
                                  ? 'border-black dark:border-white bg-black dark:bg-white shadow-lg shadow-black/20 dark:shadow-white/20 scale-110'
                                  : 'border-black/30 dark:border-white/30 bg-transparent hover:border-black/50 dark:hover:border-white/50 hover:bg-black/5 dark:hover:bg-white/5'
                              }`}
                              onClick={(e) => {
                                e.preventDefault()
                                if (selectedLicenses.includes(license.id)) {
                                  setSelectedLicenses(selectedLicenses.filter((id) => id !== license.id))
                                } else {
                                  setSelectedLicenses([...selectedLicenses, license.id])
                                }
                              }}
                            >
                              {selectedLicenses.includes(license.id) && (
                                <svg
                                  className="w-3.5 h-3.5 text-white dark:text-black"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2.5"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path d="M5 13l4 4L19 7"></path>
                                </svg>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-black dark:text-white">
                          {license.key}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {formatDate(license.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {formatDuration(license.duration)}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {formatDate(license.expiry)}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {license.note || '-'}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {license.usedOn ? formatDate(license.usedOn) : '-'}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {license.usedBy || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {license.banned ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                              Banned
                            </span>
                          ) : license.used ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                              Used
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              Unused
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative" ref={(el) => (actionDropdownRefs.current[license.id] = el)}>
                            <button
                              onClick={() => setOpenActionDropdown(openActionDropdown === license.id ? null : license.id)}
                              className="flex items-center gap-1.5 glass-input border border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 text-black dark:text-white font-semibold py-2 px-4 text-sm transition-all duration-200 hover:bg-white/80 dark:hover:bg-white/10 hover:border-black/30 dark:hover:border-white/30"
                              type="button"
                            >
                              <span>Actions</span>
                              <svg
                                className={`fill-current h-4 w-4 transition-transform duration-200 ${
                                  openActionDropdown === license.id ? 'rotate-180' : ''
                                }`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                style={{ marginTop: '3px' }}
                              >
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                              </svg>
                            </button>

                            {openActionDropdown === license.id && (
                              <div className="absolute z-50 right-0 mt-2 glass-card border border-black/20 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden animate-scale-in min-w-[160px]">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      setLicenseToDelete(license.id)
                                      setShowDeleteModal(true)
                                      setOpenActionDropdown(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                    type="button"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </button>
                                  {!license.banned && (
                                    <button
                                      onClick={() => {
                                        setLicenseToBan(license.id)
                                        setShowBanModal(true)
                                        setOpenActionDropdown(null)
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-colors flex items-center gap-2"
                                      type="button"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                      </svg>
                                      Ban
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create License Modal */}
      <CreateLicenseModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateLicenses}
        form={createForm}
        setForm={setCreateForm}
        loading={isBusy}
      />

      {/* Add Time Modal */}
      <AddTimeModal
        open={showAddTimeModal}
        onClose={() => setShowAddTimeModal(false)}
        onAdd={handleAddTime}
        form={addTimeForm}
        setForm={setAddTimeForm}
        loading={isBusy}
      />

      {/* Delete All Modal */}
      <DeleteModal
        open={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={() => handleDelete('all')}
        loading={isBusy}
        title="Delete All Licenses"
        message="Are you sure you want to delete all of your licenses? This cannot be undone."
      />

      {/* Delete Used Modal */}
      <DeleteModal
        open={showDeleteUsedModal}
        onClose={() => setShowDeleteUsedModal(false)}
        onConfirm={() => handleDelete('used')}
        loading={isBusy}
        title="Delete All Used Licenses"
        message="Are you sure you want to delete all of your used licenses? This cannot be undone."
      />

      {/* Delete Unused Modal */}
      <DeleteModal
        open={showDeleteUnusedModal}
        onClose={() => setShowDeleteUnusedModal(false)}
        onConfirm={() => handleDelete('unused')}
        loading={isBusy}
        title="Delete All Unused Licenses"
        message="Are you sure you want to delete all of your unused licenses? This cannot be undone."
      />

      {/* Delete Single Modal */}
      <DeleteModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setLicenseToDelete(null)
        }}
        onConfirm={async () => {
          if (licenseToDelete && selectedAppId) {
            setIsBusy(true)
            try {
              const res = await fetch('/api/licenses', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  appId: selectedAppId,
                  licenseIds: [licenseToDelete],
                }),
              })

              const data = await res.json()
              if (!res.ok) throw new Error(data?.error || 'Failed to delete license')

              toast({
                variant: 'success',
                title: 'License deleted',
                description: 'The license has been deleted successfully.',
              })

              setShowDeleteModal(false)
              setLicenseToDelete(null)
              router.refresh()
            } catch (e: any) {
              toast({
                variant: 'error',
                title: 'Failed to delete license',
                description: e?.message || 'Something went wrong.',
              })
            } finally {
              setIsBusy(false)
            }
          }
        }}
        loading={isBusy}
        title="Delete License"
        message="Are you sure you want to delete this license? This cannot be undone."
      />

      {/* Ban Modal */}
      <BanModal
        open={showBanModal}
        onClose={() => {
          setShowBanModal(false)
          setLicenseToBan(null)
          setBanForm({ reason: '' })
        }}
        onBan={handleBan}
        form={banForm}
        setForm={setBanForm}
        loading={isBusy}
      />
    </>
  )
}

// Modal Components
const Modal: React.FC<{
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}> = ({ open, onClose, title, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-card no-hover border border-black/20 dark:border-white/20 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
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

const CreateLicenseModal: React.FC<{
  open: boolean
  onClose: () => void
  onCreate: () => void
  form: any
  setForm: (form: any) => void
  loading: boolean
}> = ({ open, onClose, onCreate, form, setForm, loading }) => (
  <Modal open={open} onClose={onClose} title="Create A New License">
    <div className="space-y-4">
      <Input
        label="License Amount"
        type="number"
        min="1"
        max="100"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
        placeholder="1"
      />

      <Input
        label="License Mask"
        value={form.mask}
        onChange={(e) => setForm({ ...form, mask: e.target.value })}
        placeholder="******-******-******-******"
        maxLength={49}
      />

      <div className="flex items-center gap-4">
        <Checkbox
          label="Lowercase Letters"
          checked={form.lowercaseLetters}
          onChange={(e) => setForm({ ...form, lowercaseLetters: e.target.checked })}
        />
        <Checkbox
          label="Uppercase Letters"
          checked={form.uppercaseLetters}
          onChange={(e) => setForm({ ...form, uppercaseLetters: e.target.checked })}
        />
      </div>

      <Input
        label="License Level"
        type="number"
        min="1"
        value={form.level}
        onChange={(e) => setForm({ ...form, level: e.target.value })}
        placeholder="1"
      />

      <Select
        label="Expiry Unit"
        value={form.expiryUnit}
        onChange={(value) => setForm({ ...form, expiryUnit: value })}
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

      <Input
        label="License Duration"
        type="number"
        value={form.duration}
        onChange={(e) => setForm({ ...form, duration: e.target.value })}
        placeholder="1"
      />

      <Input
        label="License Note (optional)"
        value={form.note}
        onChange={(e) => setForm({ ...form, note: e.target.value })}
        placeholder="Optional note"
        maxLength={69}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button onClick={onCreate} isLoading={loading} disabled={!form.amount || !form.duration}>
          Generate Licenses
        </Button>
      </div>
    </div>
  </Modal>
)

const AddTimeModal: React.FC<{
  open: boolean
  onClose: () => void
  onAdd: () => void
  form: any
  setForm: (form: any) => void
  loading: boolean
}> = ({ open, onClose, onAdd, form, setForm, loading }) => (
  <Modal open={open} onClose={onClose} title="Add Time To Unused Licenses">
      <div className="space-y-4">
        <Select
          label="Unit of Time To Add"
          value={form.expiryUnit}
          onChange={(value) => setForm({ ...form, expiryUnit: value })}
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

      <Input
        label="Time To Add"
        type="number"
        value={form.time}
        onChange={(e) => setForm({ ...form, time: e.target.value })}
        placeholder="1"
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button onClick={onAdd} isLoading={loading} disabled={!form.time}>
          Add Time
        </Button>
      </div>
    </div>
  </Modal>
)

const DeleteModal: React.FC<{
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  title: string
  message: string
}> = ({ open, onClose, onConfirm, loading, title, message }) => (
  <Modal open={open} onClose={onClose} title={title}>
    <div className="rounded-xl border-2 border-red-500/50 bg-gradient-to-r from-red-500/10 to-red-600/10 dark:from-red-900/30 dark:to-red-800/30 text-red-700 dark:text-red-400 text-sm p-4 flex items-start gap-3">
      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div>
        <p className="font-semibold mb-1">Warning: This action cannot be undone</p>
        <p className="text-xs opacity-90">{message}</p>
      </div>
    </div>
    <div className="flex justify-end gap-3 pt-2">
      <Button variant="secondary" onClick={onClose} type="button">
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        isLoading={loading}
        className="!bg-red-600 hover:!bg-red-700 dark:!bg-red-600 dark:hover:!bg-red-700 text-white border-red-600"
      >
        Yes, I'm sure
      </Button>
    </div>
  </Modal>
)

const BanModal: React.FC<{
  open: boolean
  onClose: () => void
  onBan: () => void
  form: any
  setForm: (form: any) => void
  loading: boolean
}> = ({ open, onClose, onBan, form, setForm, loading }) => (
  <Modal open={open} onClose={onClose} title="Ban License">
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-red-500/50 bg-gradient-to-r from-red-500/10 to-red-600/10 dark:from-red-900/30 dark:to-red-800/30 text-red-700 dark:text-red-400 text-sm p-4">
        <p className="font-semibold">Notice! This will ban the license and prevent it from being used.</p>
      </div>

      <Input
        label="Reason (optional)"
        value={form.reason}
        onChange={(e) => setForm({ ...form, reason: e.target.value })}
        placeholder="Enter ban reason"
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button
          onClick={onBan}
          isLoading={loading}
          className="!bg-red-600 hover:!bg-red-700 dark:!bg-red-600 dark:hover:!bg-red-700 text-white border-red-600"
        >
          Ban License
        </Button>
      </div>
    </div>
  </Modal>
)

