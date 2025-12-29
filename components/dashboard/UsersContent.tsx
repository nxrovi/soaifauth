'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useToast } from '@/components/ui/Toast'

interface AppUser {
  id: string
  username: string
  email: string | null
  hwid: string | null
  ip: string | null
  subscription: string
  expiry: Date | null
  banned: boolean
  banReason: string | null
  paused: boolean
  createdAt: Date
  lastLogin: Date | null
  userVars: { id: string; name: string; value: string; readOnly: boolean }[]
}

interface UsersContentProps {
  user: {
    name?: string | null
    email: string
  }
  apps: { id: string; name: string }[]
  users: AppUser[]
  currentAppId: string | null
}

export const UsersContent: React.FC<UsersContentProps> = ({
  user,
  apps,
  users: initialUsers,
  currentAppId,
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [users, setUsers] = useState<AppUser[]>(initialUsers)
  const [isBusy, setIsBusy] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(currentAppId || apps[0]?.id || null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  // Table state
  const [searchQuery, setSearchQuery] = useState('')
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<keyof AppUser>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [showSubtractModal, setShowSubtractModal] = useState(false)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [showDeleteExpiredModal, setShowDeleteExpiredModal] = useState(false)
  const [showResetHwidModal, setShowResetHwidModal] = useState(false)
  const [showUnbanAllModal, setShowUnbanAllModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [showSetVarModal, setShowSetVarModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [userToBan, setUserToBan] = useState<string | null>(null)
  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null)
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null)
  const actionDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Form states
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    email: '',
    subscription: 'default',
    expiry: '',
  })

  const [extendForm, setExtendForm] = useState({
    username: 'all',
    subscription: 'default',
    time: '',
    expiryUnit: '86400',
    activeOnly: false,
  })

  const [subtractForm, setSubtractForm] = useState({
    username: '',
    subscription: 'default',
    time: '',
    expiryUnit: '86400',
  })

  const [banForm, setBanForm] = useState({
    reason: '',
  })

  const [varForm, setVarForm] = useState({
    username: '',
    varName: '',
    varValue: '',
    readOnly: false,
  })

  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    email: '',
    subscription: 'default',
    hwid: '',
    selectedVar: '',
  })

  const [userVars, setUserVars] = useState<{ id: string; name: string; value: string; readOnly: boolean }[]>([])

  const currentApp = useMemo(() => {
    return apps.find((a) => a.id === selectedAppId) || apps[0]
  }, [apps, selectedAppId])

  // Sync selectedAppId with URL
  useEffect(() => {
    const appIdFromUrl = searchParams.get('appId')
    if (appIdFromUrl && appIdFromUrl !== selectedAppId) {
      setSelectedAppId(appIdFromUrl)
    } else if (!appIdFromUrl && apps.length > 0 && !selectedAppId) {
      setSelectedAppId(apps[0].id)
    }
  }, [searchParams, apps, selectedAppId])

  // Fetch users when app changes
  useEffect(() => {
    if (selectedAppId) {
      fetch(`/api/users?appId=${selectedAppId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.users) {
            setUsers(data.users)
            setCurrentPage(1)
            setSearchQuery('')
          }
        })
        .catch(console.error)
    }
  }, [selectedAppId])

  const handleAppChange = async (appId: string) => {
    setSelectedAppId(appId)
    // Update selected app in cookie
    try {
      await fetch('/api/apps/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      })
      router.push('/dashboard/users')
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to select app',
        description: e?.message || 'Something went wrong while selecting your app.',
      })
    }
  }

  // Handle click outside for action dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(actionDropdownRefs.current).forEach(([userId, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          if (openActionDropdown === userId) {
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

  const handleCreateUser = async () => {
    if (!selectedAppId || !createForm.username || !createForm.password) {
      toast({
        variant: 'error',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      })
      return
    }

    setIsBusy(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          username: createForm.username,
          password: createForm.password,
          email: createForm.email || null,
          subscription: createForm.subscription,
          expiry: createForm.expiry || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create user')

      toast({
        variant: 'success',
        title: 'User created',
        description: 'User has been created successfully.',
      })

      setShowCreateModal(false)
      setCreateForm({
        username: '',
        password: '',
        email: '',
        subscription: 'default',
        expiry: '',
      })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to create user',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleExtend = async () => {
    if (!selectedAppId || !extendForm.time) {
      toast({
        variant: 'error',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      })
      return
    }

    setIsBusy(true)
    try {
      const res = await fetch('/api/users/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          username: extendForm.username,
          subscription: extendForm.subscription,
          time: extendForm.time,
          expiryUnit: extendForm.expiryUnit,
          activeOnly: extendForm.activeOnly,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to extend users')

      toast({
        variant: 'success',
        title: 'Users extended',
        description: `Successfully extended ${data.updated} user(s).`,
      })

      setShowExtendModal(false)
      setExtendForm({
        username: 'all',
        subscription: 'default',
        time: '',
        expiryUnit: '86400',
        activeOnly: false,
      })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to extend users',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleSubtract = async () => {
    if (!selectedAppId || !subtractForm.time) {
      toast({
        variant: 'error',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      })
      return
    }

    setIsBusy(true)
    try {
      const res = await fetch('/api/users/subtract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          username: subtractForm.username,
          subscription: subtractForm.subscription,
          time: subtractForm.time,
          expiryUnit: subtractForm.expiryUnit,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to subtract time')

      toast({
        variant: 'success',
        title: 'Time subtracted',
        description: `Successfully subtracted time from ${data.updated} user(s).`,
      })

      setShowSubtractModal(false)
      setSubtractForm({
        username: '',
        subscription: 'default',
        time: '',
        expiryUnit: '86400',
      })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to subtract time',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleDelete = async (type: 'all' | 'expired' | 'selected') => {
    if (!selectedAppId) return

    setIsBusy(true)
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          type: type === 'selected' ? undefined : type,
          userIds: type === 'selected' ? selectedUsers : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to delete users')

      toast({
        variant: 'success',
        title: 'Users deleted',
        description: `Successfully deleted ${data.deleted} user(s).`,
      })

      setShowDeleteAllModal(false)
      setShowDeleteExpiredModal(false)
      setShowDeleteModal(false)
      setSelectedUsers([])
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to delete users',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleBan = async () => {
    if (!selectedAppId || !userToBan) return

    setIsBusy(true)
    try {
      const res = await fetch('/api/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          userId: userToBan,
          reason: banForm.reason,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to ban user')

      toast({
        variant: 'success',
        title: 'User banned',
        description: 'The user has been banned successfully.',
      })

      setShowBanModal(false)
      setUserToBan(null)
      setBanForm({ reason: '' })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to ban user',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleUnbanAll = async () => {
    if (!selectedAppId) return

    setIsBusy(true)
    try {
      const res = await fetch('/api/users/unban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to unban users')

      toast({
        variant: 'success',
        title: 'Users unbanned',
        description: `Successfully unbanned ${data.updated} user(s).`,
      })

      setShowUnbanAllModal(false)
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to unban users',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleResetHwid = async () => {
    if (!selectedAppId) return

    setIsBusy(true)
    try {
      const res = await fetch('/api/users/reset-hwid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          userIds: selectedUsers.length > 0 ? selectedUsers : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to reset HWIDs')

      toast({
        variant: 'success',
        title: 'HWIDs reset',
        description: `Successfully reset HWID for ${data.updated} user(s).`,
      })

      setShowResetHwidModal(false)
      setSelectedUsers([])
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to reset HWIDs',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handlePause = async (action: 'pause' | 'unpause') => {
    if (!selectedAppId || selectedUsers.length === 0) {
      toast({
        variant: 'error',
        title: 'No users selected',
        description: 'Please select users to pause/unpause.',
      })
      return
    }

    setIsBusy(true)
    try {
      const res = await fetch('/api/users/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          userIds: selectedUsers,
          action,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update users')

      toast({
        variant: 'success',
        title: action === 'pause' ? 'Users paused' : 'Users unpaused',
        description: `Successfully ${action}d ${data.updated} user(s).`,
      })

      setSelectedUsers([])
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to update users',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleExport = () => {
    const data = users.map((u) => ({
      username: u.username,
      email: u.email,
      hwid: u.hwid,
      ip: u.ip,
      subscription: u.subscription,
      expiry: u.expiry?.toISOString() || null,
      banned: u.banned,
      banReason: u.banReason,
      paused: u.paused,
      createdAt: u.createdAt.toISOString(),
      lastLogin: u.lastLogin?.toISOString() || null,
    }))

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      variant: 'success',
      title: 'Users exported',
      description: 'Your users have been exported successfully.',
    })
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'N/A'
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${year}-${month}-${day} @ ${displayHours}:${minutes} ${ampm}`
  }

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.hwid?.toLowerCase().includes(query) ||
          u.ip?.toLowerCase().includes(query)
      )
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (aVal instanceof Date && bVal instanceof Date) {
        return sortDirection === 'asc'
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime()
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return 0
    })

    return filtered
  }, [users, searchQuery, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedUsers.slice(start, start + itemsPerPage)
  }, [filteredAndSortedUsers, currentPage, itemsPerPage])

  const handleSort = (field: keyof AppUser) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleResetHwidSingle = async (userId: string) => {
    if (!selectedAppId) return

    setIsBusy(true)
    try {
      const res = await fetch('/api/users/reset-hwid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          userIds: [userId],
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to reset HWID')

      toast({
        variant: 'success',
        title: 'HWID reset',
        description: 'The user HWID has been reset successfully.',
      })

      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to reset HWID',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handlePauseSingle = async (userId: string, action: 'pause' | 'unpause') => {
    if (!selectedAppId) return

    setIsBusy(true)
    try {
      const res = await fetch('/api/users/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          userIds: [userId],
          action,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update user')

      toast({
        variant: 'success',
        title: action === 'pause' ? 'User paused' : 'User unpaused',
        description: `The user has been ${action}d successfully.`,
      })

      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to update user',
        description: e?.message || 'Something went wrong.',
      })
    } finally {
      setIsBusy(false)
    }
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
              Users
            </h1>
            <p className="text-xs text-black/60 dark:text-white/60">
              After someone registers for your app with a license, they will appear here.{' '}
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
                Create User
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowSetVarModal(true)}
                isLoading={isBusy}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                User Variables
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowExtendModal(true)}
                isLoading={isBusy}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Extend User(s)
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowSubtractModal(true)}
                isLoading={isBusy}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Subtract User(s)
              </Button>

              <Button
                variant="secondary"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Users
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
                Delete All Users
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowDeleteExpiredModal(true)}
                isLoading={isBusy}
                className="flex items-center gap-2 !bg-red-500/10 hover:!bg-red-500/20 !text-red-600 dark:!text-red-400 !border-red-500/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Expired Users
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowResetHwidModal(true)}
                isLoading={isBusy}
                className="flex items-center gap-2 !bg-red-500/10 hover:!bg-red-500/20 !text-red-600 dark:!text-red-400 !border-red-500/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset All Users HWID
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowUnbanAllModal(true)}
                isLoading={isBusy}
                className="flex items-center gap-2 !bg-red-500/10 hover:!bg-red-500/20 !text-red-600 dark:!text-red-400 !border-red-500/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Unban All Users
              </Button>

              {selectedUsers.length > 0 && (
                <div className="relative" ref={(el) => (actionDropdownRefs.current['selection'] = el)}>
                  <button
                    onClick={() => setOpenActionDropdown(openActionDropdown === 'selection' ? null : 'selection')}
                    className="flex items-center gap-1.5 glass-input border border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 text-black dark:text-white font-semibold py-2 px-4 text-sm transition-all duration-200 hover:bg-white/80 dark:hover:bg-white/10 hover:border-black/30 dark:hover:border-white/30"
                    type="button"
                  >
                    <span>Selection Options</span>
                    <svg
                      className={`fill-current h-4 w-4 transition-transform duration-200 ${
                        openActionDropdown === 'selection' ? 'rotate-180' : ''
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      style={{ marginTop: '3px' }}
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                    </svg>
                  </button>

                  {openActionDropdown === 'selection' && (
                    <div className="absolute z-50 right-0 mt-2 glass-card border border-black/20 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden animate-scale-in min-w-[180px]">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleDelete('selected')
                            setOpenActionDropdown(null)
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                          type="button"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete selected
                        </button>
                        <button
                          onClick={() => {
                            handlePause('pause')
                            setOpenActionDropdown(null)
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-colors flex items-center gap-2"
                          type="button"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pause selected
                        </button>
                        <button
                          onClick={() => {
                            handlePause('unpause')
                            setOpenActionDropdown(null)
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
                          type="button"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Unpause selected
                        </button>
                        <button
                          onClick={() => {
                            handleResetHwid()
                            setOpenActionDropdown(null)
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                          type="button"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reset HWIDs
                        </button>
                        <button
                          onClick={async () => {
                            if (!selectedAppId) return
                            setIsBusy(true)
                            try {
                              const res = await fetch('/api/users/unban', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  appId: selectedAppId,
                                  userIds: selectedUsers,
                                }),
                              })
                              const data = await res.json()
                              if (!res.ok) throw new Error(data?.error || 'Failed to unban users')
                              toast({
                                variant: 'success',
                                title: 'Users unbanned',
                                description: `Successfully unbanned ${data.updated} user(s).`,
                              })
                              setSelectedUsers([])
                              setOpenActionDropdown(null)
                              router.refresh()
                            } catch (e: any) {
                              toast({
                                variant: 'error',
                                title: 'Failed to unban users',
                                description: e?.message || 'Something went wrong.',
                              })
                            } finally {
                              setIsBusy(false)
                            }
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-500/10 dark:hover:bg-green-500/20 transition-colors flex items-center gap-2"
                          type="button"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Unban selected
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Search and Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-black/70 dark:text-white/70">Show</label>
                <Select
                  value={String(itemsPerPage)}
                  onChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}
                  className="w-20"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-black/70 dark:text-white/70">Search:</label>
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search users..."
                  className="w-48"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Select
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onClick={() => handleSort('username')}
                    >
                      <div className="flex items-center gap-2">
                        Username
                        {sortField === 'username' && (
                          <svg
                            className={`w-4 h-4 ${sortDirection === 'asc' ? '' : 'rotate-180'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onClick={() => handleSort('hwid')}
                    >
                      <div className="flex items-center gap-2">
                        HWID
                        {sortField === 'hwid' && (
                          <svg
                            className={`w-4 h-4 ${sortDirection === 'asc' ? '' : 'rotate-180'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onClick={() => handleSort('ip')}
                    >
                      <div className="flex items-center gap-2">
                        IP
                        {sortField === 'ip' && (
                          <svg
                            className={`w-4 h-4 ${sortDirection === 'asc' ? '' : 'rotate-180'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-2">
                        Creation Date
                        {sortField === 'createdAt' && (
                          <svg
                            className={`w-4 h-4 ${sortDirection === 'asc' ? '' : 'rotate-180'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      onClick={() => handleSort('lastLogin')}
                    >
                      <div className="flex items-center gap-2">
                        Last Login Date
                        {sortField === 'lastLogin' && (
                          <svg
                            className={`w-4 h-4 ${sortDirection === 'asc' ? '' : 'rotate-180'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Banned?
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-black/60 dark:text-white/60">
                        {searchQuery ? 'No users found matching your search.' : 'No users found. Users will appear here after they register with a license.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((appUser) => (
                      <tr
                        key={appUser.id}
                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="relative inline-block">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(appUser.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers([...selectedUsers, appUser.id])
                                } else {
                                  setSelectedUsers(selectedUsers.filter((id) => id !== appUser.id))
                                }
                              }}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center cursor-pointer ${
                                selectedUsers.includes(appUser.id)
                                  ? 'border-black dark:border-white bg-black dark:bg-white shadow-lg shadow-black/20 dark:shadow-white/20 scale-110'
                                  : 'border-black/30 dark:border-white/30 bg-transparent hover:border-black/50 dark:hover:border-white/50 hover:bg-black/5 dark:hover:bg-white/5'
                              }`}
                              onClick={(e) => {
                                e.preventDefault()
                                if (selectedUsers.includes(appUser.id)) {
                                  setSelectedUsers(selectedUsers.filter((id) => id !== appUser.id))
                                } else {
                                  setSelectedUsers([...selectedUsers, appUser.id])
                                }
                              }}
                            >
                              {selectedUsers.includes(appUser.id) && (
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
                        <td className="px-4 py-3 font-medium text-black dark:text-white">
                          {appUser.username}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70 font-mono text-xs">
                          <span className="blur-sm hover:blur-none transition-all duration-200">
                            {appUser.hwid || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70 font-mono text-xs">
                          <span className="blur-sm hover:blur-none transition-all duration-200">
                            {appUser.ip || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {formatDate(appUser.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {formatDate(appUser.lastLogin)}
                        </td>
                        <td className="px-4 py-3">
                          {appUser.banned ? (
                            <span className="px-2.5 py-0.5 text-xs font-medium rounded border border-red-700 text-red-700 dark:text-red-400">
                              Banned
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 text-xs font-medium rounded border border-emerald-700 text-emerald-700 dark:text-emerald-400">
                              Unbanned
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative" ref={(el) => (actionDropdownRefs.current[appUser.id] = el)}>
                            <button
                              onClick={() => setOpenActionDropdown(openActionDropdown === appUser.id ? null : appUser.id)}
                              className="flex items-center gap-1.5 glass-input border border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 text-black dark:text-white font-semibold py-2 px-4 text-sm transition-all duration-200 hover:bg-white/80 dark:hover:bg-white/10 hover:border-black/30 dark:hover:border-white/30"
                              type="button"
                            >
                              <span>Actions</span>
                              <svg
                                className={`fill-current h-4 w-4 transition-transform duration-200 ${
                                  openActionDropdown === appUser.id ? 'rotate-180' : ''
                                }`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                style={{ marginTop: '3px' }}
                              >
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                              </svg>
                            </button>

                            {openActionDropdown === appUser.id && (
                              <div className="absolute z-50 right-0 mt-2 glass-card border border-black/20 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden animate-scale-in min-w-[180px]">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      setUserToDelete(appUser.id)
                                      setShowDeleteModal(true)
                                      setOpenActionDropdown(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                    type="button"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete User
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleResetHwidSingle(appUser.id)
                                      setOpenActionDropdown(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                    type="button"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Reset User HWID
                                  </button>
                                  {!appUser.banned && (
                                    <button
                                      onClick={() => {
                                        setUserToBan(appUser.id)
                                        setShowBanModal(true)
                                        setOpenActionDropdown(null)
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                                      type="button"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                      </svg>
                                      Ban User
                                    </button>
                                  )}
                                  {!appUser.paused ? (
                                    <button
                                      onClick={() => {
                                        handlePauseSingle(appUser.id, 'pause')
                                        setOpenActionDropdown(null)
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                      type="button"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Pause User
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        handlePauseSingle(appUser.id, 'unpause')
                                        setOpenActionDropdown(null)
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                      type="button"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Unpause User
                                    </button>
                                  )}
                                  <button
                                    onClick={async () => {
                                      setUserToEdit(appUser)
                                      setEditForm({
                                        username: appUser.username,
                                        password: '',
                                        email: appUser.email || '',
                                        subscription: appUser.subscription,
                                        hwid: appUser.hwid || '',
                                        selectedVar: '',
                                      })
                                      
                                      // Fetch user variables
                                      if (selectedAppId) {
                                        try {
                                          const res = await fetch(`/api/users/vars?appId=${selectedAppId}&userId=${appUser.id}`)
                                          const data = await res.json()
                                          if (data.vars) {
                                            setUserVars(data.vars)
                                          }
                                        } catch (e) {
                                          console.error('Failed to fetch user variables:', e)
                                        }
                                      }
                                      
                                      setShowEditModal(true)
                                      setOpenActionDropdown(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                                    type="button"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit User
                                  </button>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-black/60 dark:text-white/60">
                  Showing {filteredAndSortedUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} of{' '}
                  {filteredAndSortedUsers.length} records
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 glass-input border border-black/20 dark:border-white/20 rounded-lg text-sm font-medium text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                    type="button"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 glass-input border rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-black/10 dark:bg-white/10 border-black/30 dark:border-white/30 text-black dark:text-white'
                            : 'border-black/20 dark:border-white/20 text-black/70 dark:text-white/70 hover:bg-white/80 dark:hover:bg-white/10'
                        }`}
                        type="button"
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 glass-input border border-black/20 dark:border-white/20 rounded-lg text-sm font-medium text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateUser}
        form={createForm}
        setForm={setCreateForm}
        loading={isBusy}
      />

      {/* Extend User Modal */}
      <ExtendUserModal
        open={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        onExtend={handleExtend}
        form={extendForm}
        setForm={setExtendForm}
        loading={isBusy}
      />

      {/* Subtract User Modal */}
      <SubtractUserModal
        open={showSubtractModal}
        onClose={() => setShowSubtractModal(false)}
        onSubtract={handleSubtract}
        form={subtractForm}
        setForm={setSubtractForm}
        loading={isBusy}
      />

      {/* Delete All Modal */}
      <DeleteModal
        open={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={() => handleDelete('all')}
        loading={isBusy}
        title="Delete All Users"
        message="You're about to delete all your users. This cannot be undone."
      />

      {/* Delete Expired Modal */}
      <DeleteModal
        open={showDeleteExpiredModal}
        onClose={() => setShowDeleteExpiredModal(false)}
        onConfirm={() => handleDelete('expired')}
        loading={isBusy}
        title="Delete Expired Users"
        message="You're about to delete all your expired users. This cannot be undone."
      />

      {/* Reset HWID Modal */}
      <DeleteModal
        open={showResetHwidModal}
        onClose={() => setShowResetHwidModal(false)}
        onConfirm={handleResetHwid}
        loading={isBusy}
        title="Reset All Users HWID"
        message="You're about to reset all users HWIDs. This will allow users to login from different devices."
        confirmText="Yes, Reset HWIDs"
      />

      {/* Unban All Modal */}
      <DeleteModal
        open={showUnbanAllModal}
        onClose={() => setShowUnbanAllModal(false)}
        onConfirm={handleUnbanAll}
        loading={isBusy}
        title="Unban All Users"
        message="You're about to unban all banned users."
        confirmText="Yes, Unban All"
        variant="success"
      />

      {/* Delete Single Modal */}
      <DeleteModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setUserToDelete(null)
        }}
        onConfirm={async () => {
          if (userToDelete && selectedAppId) {
            setIsBusy(true)
            try {
              const res = await fetch('/api/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  appId: selectedAppId,
                  userIds: [userToDelete],
                }),
              })
              const data = await res.json()
              if (!res.ok) throw new Error(data?.error || 'Failed to delete user')
              toast({
                variant: 'success',
                title: 'User deleted',
                description: 'The user has been deleted successfully.',
              })
              setShowDeleteModal(false)
              setUserToDelete(null)
              router.refresh()
            } catch (e: any) {
              toast({
                variant: 'error',
                title: 'Failed to delete user',
                description: e?.message || 'Something went wrong.',
              })
            } finally {
              setIsBusy(false)
            }
          }
        }}
        loading={isBusy}
        title="Delete User"
        message="Are you sure you want to delete this user? This cannot be undone."
      />

      {/* Ban Modal */}
      <BanModal
        open={showBanModal}
        onClose={() => {
          setShowBanModal(false)
          setUserToBan(null)
          setBanForm({ reason: '' })
        }}
        onBan={handleBan}
        form={banForm}
        setForm={setBanForm}
        loading={isBusy}
      />

      {/* Set User Var Modal */}
      <SetUserVarModal
        open={showSetVarModal}
        onClose={() => {
          setShowSetVarModal(false)
          setVarForm({ username: '', varName: '', varValue: '', readOnly: false })
        }}
        form={varForm}
        setForm={setVarForm}
        loading={isBusy}
        appId={selectedAppId}
      />

      {/* Edit User Modal */}
      <EditUserModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setUserToEdit(null)
          setEditForm({ username: '', password: '', email: '', subscription: 'default', hwid: '', selectedVar: '' })
          setUserVars([])
        }}
        user={userToEdit}
        form={editForm}
        setForm={setEditForm}
        userVars={userVars}
        setUserVars={setUserVars}
        loading={isBusy}
        appId={selectedAppId}
        onSave={async () => {
          if (!selectedAppId || !userToEdit) return

          setIsBusy(true)
          try {
            const res = await fetch('/api/users/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                appId: selectedAppId,
                userId: userToEdit.id,
                username: editForm.username,
                password: editForm.password || undefined,
                email: editForm.email,
                subscription: editForm.subscription,
                hwid: editForm.hwid,
              }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Failed to update user')

            toast({
              variant: 'success',
              title: 'User updated',
              description: 'The user has been updated successfully.',
            })

            setShowEditModal(false)
            setUserToEdit(null)
            router.refresh()
          } catch (e: any) {
            toast({
              variant: 'error',
              title: 'Failed to update user',
              description: e?.message || 'Something went wrong.',
            })
          } finally {
            setIsBusy(false)
          }
        }}
        onDeleteSubscription={async () => {
          if (!selectedAppId || !userToEdit) return

          setIsBusy(true)
          try {
            const res = await fetch('/api/users/delete-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                appId: selectedAppId,
                userId: userToEdit.id,
              }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Failed to delete subscription')

            toast({
              variant: 'success',
              title: 'Subscription deleted',
              description: 'The subscription has been deleted successfully.',
            })

            router.refresh()
            // Refresh user data
            if (selectedAppId) {
              const res2 = await fetch(`/api/users?appId=${selectedAppId}`)
              const data2 = await res2.json()
              if (data2.users) {
                const updatedUser = data2.users.find((u: AppUser) => u.id === userToEdit.id)
                if (updatedUser) {
                  setUserToEdit(updatedUser)
                  setEditForm({
                    ...editForm,
                    subscription: updatedUser.subscription,
                  })
                }
              }
            }
          } catch (e: any) {
            toast({
              variant: 'error',
              title: 'Failed to delete subscription',
              description: e?.message || 'Something went wrong.',
            })
          } finally {
            setIsBusy(false)
          }
        }}
        onDeleteVar={async () => {
          if (!selectedAppId || !userToEdit || !editForm.selectedVar) return

          setIsBusy(true)
          try {
            const res = await fetch('/api/users/vars', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                appId: selectedAppId,
                userId: userToEdit.id,
                varName: editForm.selectedVar,
              }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Failed to delete user variable')

            toast({
              variant: 'success',
              title: 'User variable deleted',
              description: 'The user variable has been deleted successfully.',
            })

            // Refresh user variables
            if (selectedAppId) {
              const res2 = await fetch(`/api/users/vars?appId=${selectedAppId}&userId=${userToEdit.id}`)
              const data2 = await res2.json()
              if (data2.vars) {
                setUserVars(data2.vars)
              }
            }

            setEditForm({ ...editForm, selectedVar: '' })
          } catch (e: any) {
            toast({
              variant: 'error',
              title: 'Failed to delete user variable',
              description: e?.message || 'Something went wrong.',
            })
          } finally {
            setIsBusy(false)
          }
        }}
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

const CreateUserModal: React.FC<{
  open: boolean
  onClose: () => void
  onCreate: () => void
  form: any
  setForm: (form: any) => void
  loading: boolean
}> = ({ open, onClose, onCreate, form, setForm, loading }) => (
  <Modal open={open} onClose={onClose} title="Create User">
    <div className="space-y-4">
      <Input
        label="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        placeholder="Enter username"
        required
      />

      <Input
        label="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        placeholder="Enter password"
        required
      />

      <Input
        label="Email (Optional)"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        placeholder="user@example.com"
      />

      <Select
        label="Subscription"
        value={form.subscription}
        onChange={(value) => setForm({ ...form, subscription: value })}
      >
        <option value="default">default</option>
      </Select>

      <DateTimePicker
        label="Expiration (Optional)"
        value={form.expiry}
        onChange={(value) => setForm({ ...form, expiry: value })}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button onClick={onCreate} isLoading={loading} disabled={!form.username || !form.password}>
          Add User
        </Button>
      </div>
    </div>
  </Modal>
)

const ExtendUserModal: React.FC<{
  open: boolean
  onClose: () => void
  onExtend: () => void
  form: any
  setForm: (form: any) => void
  loading: boolean
}> = ({ open, onClose, onExtend, form, setForm, loading }) => (
  <Modal open={open} onClose={onClose} title="Extend User(s)">
    <div className="space-y-4">
      <Input
        label="User (leave empty or 'all' for all users)"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        placeholder="all"
      />

      <Select
        label="Subscription"
        value={form.subscription}
        onChange={(value) => setForm({ ...form, subscription: value })}
      >
        <option value="default">default</option>
      </Select>

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
        label="Time To Add"
        type="number"
        value={form.time}
        onChange={(e) => setForm({ ...form, time: e.target.value })}
        placeholder="1"
      />

      <Checkbox
        label="Active users only"
        checked={form.activeOnly}
        onChange={(e) => setForm({ ...form, activeOnly: e.target.checked })}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button onClick={onExtend} isLoading={loading} disabled={!form.time}>
          Extend User(s)
        </Button>
      </div>
    </div>
  </Modal>
)

const SubtractUserModal: React.FC<{
  open: boolean
  onClose: () => void
  onSubtract: () => void
  form: any
  setForm: (form: any) => void
  loading: boolean
}> = ({ open, onClose, onSubtract, form, setForm, loading }) => (
  <Modal open={open} onClose={onClose} title="Subtract Time From User(s)">
    <div className="space-y-4">
      <Input
        label="User"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        placeholder="Enter username"
      />

      <Select
        label="Subscription"
        value={form.subscription}
        onChange={(value) => setForm({ ...form, subscription: value })}
      >
        <option value="default">default</option>
      </Select>

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
        label="Time To Subtract"
        type="number"
        value={form.time}
        onChange={(e) => setForm({ ...form, time: e.target.value })}
        placeholder="1"
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button onClick={onSubtract} isLoading={loading} disabled={!form.time}>
          Subtract Time
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
  confirmText?: string
  variant?: 'danger' | 'success'
}> = ({ open, onClose, onConfirm, loading, title, message, confirmText = "Yes, I'm sure", variant = 'danger' }) => (
  <Modal open={open} onClose={onClose} title={title}>
    <div className={`rounded-xl border-2 ${
      variant === 'danger'
        ? 'border-red-500/50 bg-gradient-to-r from-red-500/10 to-red-600/10 dark:from-red-900/30 dark:to-red-800/30 text-red-700 dark:text-red-400'
        : 'border-emerald-500/50 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 dark:from-emerald-900/30 dark:to-emerald-800/30 text-emerald-700 dark:text-emerald-400'
    } text-sm p-4 flex items-start gap-3`}>
      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div>
        <p className="font-semibold mb-1">Notice!</p>
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
        className={variant === 'danger' 
          ? "!bg-red-600 hover:!bg-red-700 dark:!bg-red-600 dark:hover:!bg-red-700 text-white border-red-600"
          : "!bg-emerald-600 hover:!bg-emerald-700 dark:!bg-emerald-600 dark:hover:!bg-emerald-700 text-white border-emerald-600"
        }
      >
        {confirmText}
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
  <Modal open={open} onClose={onClose} title="Ban User">
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-red-500/50 bg-gradient-to-r from-red-500/10 to-red-600/10 dark:from-red-900/30 dark:to-red-800/30 text-red-700 dark:text-red-400 text-sm p-4">
        <p className="font-semibold">Are you sure you want to ban this user?</p>
      </div>

      <Input
        label="Ban Reason (optional)"
        value={form.reason}
        onChange={(e) => setForm({ ...form, reason: e.target.value })}
        placeholder="Enter ban reason"
        maxLength={99}
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
          Ban User
        </Button>
      </div>
    </div>
  </Modal>
)

const SetUserVarModal: React.FC<{
  open: boolean
  onClose: () => void
  form: any
  setForm: (form: any) => void
  loading: boolean
  appId: string | null
}> = ({ open, onClose, form, setForm, loading, appId }) => {
  const { toast } = useToast()
  const router = useRouter()

  const handleSetVar = async () => {
    if (!appId || !form.username || !form.varName || !form.varValue) {
      toast({
        variant: 'error',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      })
      return
    }

    // Find user by username
    try {
      const usersRes = await fetch(`/api/users?appId=${appId}`)
      const usersData = await usersRes.json()
      const user = usersData.users?.find((u: AppUser) => u.username === form.username)

      if (!user) {
        toast({
          variant: 'error',
          title: 'User not found',
          description: 'Please enter a valid username.',
        })
        return
      }

      const res = await fetch('/api/users/vars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          userId: user.id,
          varName: form.varName,
          varValue: form.varValue,
          readOnly: form.readOnly,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to set user variable')

      toast({
        variant: 'success',
        title: 'User variable set',
        description: 'The user variable has been set successfully.',
      })

      onClose()
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to set user variable',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Set User Variable">
      <div className="space-y-4">
        <Input
          label="User"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="Type username here"
        />

        <Input
          label="Variable"
          value={form.varName}
          onChange={(e) => setForm({ ...form, varName: e.target.value })}
          placeholder="Variable name"
        />

        <div>
          <label className="block text-sm font-semibold mb-2 text-black/90 dark:text-white/90">
            User Variable Data
          </label>
          <textarea
            value={form.varValue}
            onChange={(e) => setForm({ ...form, varValue: e.target.value })}
            rows={4}
            className="glass-input w-full px-4 py-3 rounded-xl text-sm"
            placeholder="Enter variable value"
            maxLength={500}
          />
        </div>

        <Checkbox
          label="Readonly"
          checked={form.readOnly}
          onChange={(e) => setForm({ ...form, readOnly: e.target.checked })}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={handleSetVar} isLoading={loading} disabled={!form.username || !form.varName || !form.varValue}>
            Set User Var
          </Button>
        </div>
      </div>
    </Modal>
  )
}

const EditUserModal: React.FC<{
  open: boolean
  onClose: () => void
  user: AppUser | null
  form: any
  setForm: (form: any) => void
  userVars: { id: string; name: string; value: string; readOnly: boolean }[]
  setUserVars: (vars: { id: string; name: string; value: string; readOnly: boolean }[]) => void
  loading: boolean
  appId: string | null
  onSave: () => void
  onDeleteSubscription: () => void
  onDeleteVar: () => void
}> = ({ open, onClose, user, form, setForm, userVars, setUserVars, loading, appId, onSave, onDeleteSubscription, onDeleteVar }) => {
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'N/A'
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${year}-${month}-${day} @ ${displayHours}:${minutes} ${ampm}`
  }

  if (!user) return null

  return (
    <Modal open={open} onClose={onClose} title="Edit User">
      <div className="space-y-4">
        <Input
          label="Username:"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="Enter username"
          required
        />

        <Input
          label="Password:"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Leave empty to keep current password"
        />

        <Input
          label="Email:"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Enter email"
        />

        <div>
          <label className="block text-sm font-semibold mb-2 text-black/90 dark:text-white/90">
            User Subscription
          </label>
          <Select
            value={form.subscription}
            onChange={(value) => setForm({ ...form, subscription: value })}
          >
            <option value="default">
              [default] - Expires: {user.expiry ? formatDate(user.expiry) : 'Never'}
            </option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-black/90 dark:text-white/90">
            User Variable
          </label>
          <Select
            value={form.selectedVar}
            onChange={(value) => setForm({ ...form, selectedVar: value })}
            placeholder="Select a variable"
          >
            <option value="">-- Select Variable --</option>
            {userVars.map((v) => (
              <option key={v.id} value={v.name}>
                {v.name}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Additional HWID:"
          value={form.hwid}
          onChange={(e) => setForm({ ...form, hwid: e.target.value })}
          placeholder="Enter additional HWID"
        />

        <div className="space-y-1">
          <p className="text-xs text-black/60 dark:text-white/60">HWID: {user.hwid || 'N/A'}</p>
          <p className="text-xs text-black/60 dark:text-white/60">IP: {user.ip || 'N/A'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            onClick={onDeleteSubscription}
            isLoading={loading}
            className="!bg-orange-600 hover:!bg-orange-700 dark:!bg-orange-600 dark:hover:!bg-orange-700 text-white border-orange-600"
          >
            Delete Subscription
          </Button>
          <Button onClick={onSave} isLoading={loading} disabled={!form.username}>
            Save Changes
          </Button>
          <Button
            onClick={onDeleteVar}
            isLoading={loading}
            disabled={!form.selectedVar}
            className="!bg-yellow-600 hover:!bg-yellow-700 dark:!bg-yellow-600 dark:hover:!bg-yellow-700 text-white border-yellow-600"
          >
            Delete User Variable
          </Button>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

