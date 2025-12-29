'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

interface Subscription {
  id: string
  name: string
  level: number
  paused: boolean
  createdAt: Date
}

interface SubscriptionsContentProps {
  user: {
    name?: string | null
    email: string
  }
  apps: { id: string; name: string }[]
  subscriptions: Subscription[]
  currentAppId: string | null
}

export const SubscriptionsContent: React.FC<SubscriptionsContentProps> = ({
  user,
  apps,
  subscriptions: initialSubscriptions,
  currentAppId,
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(currentAppId || apps[0]?.id || null)
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null)
  const actionDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<Subscription | null>(null)

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    level: '1',
  })

  const [editForm, setEditForm] = useState({
    name: '',
    level: '1',
  })

  const currentApp = useMemo(() => {
    return apps.find((a) => a.id === selectedAppId) || apps[0]
  }, [apps, selectedAppId])

  const handleAppChange = async (appId: string) => {
    setSelectedAppId(appId)
    try {
      await fetch('/api/apps/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      })
      router.push('/dashboard/subscriptions')
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to select app',
        description: e?.message || 'Something went wrong while selecting your app.',
      })
    }
  }

  const handleCreate = async () => {
    if (!selectedAppId || !createForm.name || !createForm.level) {
      toast({
        variant: 'error',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      })
      return
    }

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          name: createForm.name,
          level: Number(createForm.level),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create subscription')

      toast({
        variant: 'success',
        title: 'Subscription created',
        description: 'The subscription has been created successfully.',
      })

      setShowCreateModal(false)
      setCreateForm({ name: '', level: '1' })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to create subscription',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleDelete = async (subscriptionName?: string) => {
    if (!selectedAppId) return

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          subscriptionName,
          subscriptionIds: subscriptionName ? undefined : selectedSubscriptions,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to delete subscription')

      toast({
        variant: 'success',
        title: 'Subscription deleted',
        description: subscriptionName
          ? 'The subscription has been deleted successfully.'
          : `Successfully deleted ${data.deleted} subscription(s).`,
      })

      setShowDeleteAllModal(false)
      setSelectedSubscriptions([])
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to delete subscription',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handlePause = async (subscriptionName: string, pause: boolean) => {
    if (!selectedAppId) return

    try {
      const res = await fetch('/api/subscriptions/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          subscriptionName,
          pause,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update subscription')

      toast({
        variant: 'success',
        title: pause ? 'Subscription paused' : 'Subscription unpaused',
        description: `The subscription has been ${pause ? 'paused' : 'unpaused'} successfully.`,
      })

      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to update subscription',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleEdit = (subscription: Subscription) => {
    setSubscriptionToEdit(subscription)
    setEditForm({
      name: subscription.name,
      level: subscription.level.toString(),
    })
    setShowEditModal(true)
    setOpenActionDropdown(null)
  }

  const handleUpdate = async () => {
    if (!selectedAppId || !subscriptionToEdit || !editForm.name || !editForm.level) {
      toast({
        variant: 'error',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      })
      return
    }

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          subscriptionId: subscriptionToEdit.id,
          name: editForm.name,
          level: Number(editForm.level),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update subscription')

      toast({
        variant: 'success',
        title: 'Subscription updated',
        description: 'The subscription has been updated successfully.',
      })

      setShowEditModal(false)
      setSubscriptionToEdit(null)
      setEditForm({ name: '', level: '1' })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to update subscription',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleCheckboxChange = (subscriptionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSubscriptions([...selectedSubscriptions, subscriptionId])
    } else {
      setSelectedSubscriptions(selectedSubscriptions.filter((id) => id !== subscriptionId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubscriptions(filteredSubscriptions.map((s) => s.id))
    } else {
      setSelectedSubscriptions([])
    }
  }

  // Filter and paginate subscriptions
  const filteredSubscriptions = useMemo(() => {
    let filtered = subscriptions

    if (searchQuery) {
      filtered = filtered.filter((sub) =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [subscriptions, searchQuery])

  const paginatedSubscriptions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredSubscriptions.slice(start, end)
  }, [filteredSubscriptions, currentPage, pageSize])

  const totalPages = Math.ceil(filteredSubscriptions.length / pageSize)

  // Handle click outside for action dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(actionDropdownRefs.current).forEach(([subscriptionId, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          if (openActionDropdown === subscriptionId) {
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
              Subscriptions
            </h1>
            <p className="text-xs text-black/60 dark:text-white/60">
                  Subscriptions act as levels/tiers.{' '}
                  <a
                    href="https://keyauthdocs.apidog.io/dashboard/app/subscriptions"
                    target="_blank"
                    rel="noopener noreferrer"
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
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Subscription
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteAllModal(true)}
                className="flex items-center gap-2 !bg-red-500/10 hover:!bg-red-500/20 !text-red-600 dark:!text-red-400 !border-red-500/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete All Subscriptions
              </Button>
              {selectedSubscriptions.length > 0 && (
                <div className="relative" ref={(el) => { actionDropdownRefs.current['selection'] = el }}>
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
                            handleDelete()
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
                              selectedSubscriptions.forEach((id) => {
                                const sub = subscriptions.find((s) => s.id === id)
                                if (sub) handlePause(sub.name, true)
                              })
                              setSelectedSubscriptions([])
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
                              selectedSubscriptions.forEach((id) => {
                                const sub = subscriptions.find((s) => s.id === id)
                                if (sub) handlePause(sub.name, false)
                              })
                              setSelectedSubscriptions([])
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
                  value={String(pageSize)}
                  onChange={(value) => {
                    setPageSize(Number(value))
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
                  placeholder="Search subscriptions..."
                  className="w-48"
                />
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      <div className="relative inline-block">
                      <input
                        type="checkbox"
                        checked={selectedSubscriptions.length === filteredSubscriptions.length && filteredSubscriptions.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center cursor-pointer ${
                            selectedSubscriptions.length === filteredSubscriptions.length && filteredSubscriptions.length > 0
                              ? 'border-black dark:border-white bg-black dark:bg-white shadow-lg shadow-black/20 dark:shadow-white/20 scale-110'
                              : 'border-black/30 dark:border-white/30 bg-transparent hover:border-black/50 dark:hover:border-white/50 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            handleSelectAll(selectedSubscriptions.length !== filteredSubscriptions.length || filteredSubscriptions.length === 0)
                          }}
                        >
                          {selectedSubscriptions.length === filteredSubscriptions.length && filteredSubscriptions.length > 0 && (
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
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Subscription Name
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      License Level
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {paginatedSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-black/60 dark:text-white/60">
                        {searchQuery ? 'No subscriptions found matching your search.' : 'No subscriptions found. Create your first subscription to get started.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedSubscriptions.map((subscription) => (
                      <tr
                        key={subscription.id}
                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="relative inline-block">
                          <input
                            type="checkbox"
                            checked={selectedSubscriptions.includes(subscription.id)}
                            onChange={(e) => handleCheckboxChange(subscription.id, e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center cursor-pointer ${
                                selectedSubscriptions.includes(subscription.id)
                                  ? 'border-black dark:border-white bg-black dark:bg-white shadow-lg shadow-black/20 dark:shadow-white/20 scale-110'
                                  : 'border-black/30 dark:border-white/30 bg-transparent hover:border-black/50 dark:hover:border-white/50 hover:bg-black/5 dark:hover:bg-white/5'
                              }`}
                              onClick={(e) => {
                                e.preventDefault()
                                handleCheckboxChange(subscription.id, !selectedSubscriptions.includes(subscription.id))
                              }}
                            >
                              {selectedSubscriptions.includes(subscription.id) && (
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
                          {subscription.name}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {subscription.level}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative" ref={(el) => { actionDropdownRefs.current[subscription.id] = el }}>
                            <button
                              onClick={() => setOpenActionDropdown(openActionDropdown === subscription.id ? null : subscription.id)}
                              className="flex items-center gap-1.5 glass-input border border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 text-black dark:text-white font-semibold py-2 px-4 text-sm transition-all duration-200 hover:bg-white/80 dark:hover:bg-white/10 hover:border-black/30 dark:hover:border-white/30"
                              type="button"
                            >
                              <span>Actions</span>
                              <svg
                                className={`fill-current h-4 w-4 transition-transform duration-200 ${
                                  openActionDropdown === subscription.id ? 'rotate-180' : ''
                                }`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                style={{ marginTop: '3px' }}
                              >
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                              </svg>
                            </button>
                            {openActionDropdown === subscription.id && (
                              <div className="absolute z-50 right-0 mt-2 glass-card border border-black/20 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden animate-scale-in min-w-[180px]">
                                <div className="py-1">
                                    <button
                                    onClick={() => {
                                      handleDelete(subscription.name)
                                      setOpenActionDropdown(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                    type="button"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                      Delete Subscription
                                    </button>
                                    <button
                                    onClick={() => {
                                      handlePause(subscription.name, true)
                                      setOpenActionDropdown(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-colors flex items-center gap-2"
                                    type="button"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                      Pause Subscription
                                    </button>
                                    <button
                                    onClick={() => {
                                      handlePause(subscription.name, false)
                                      setOpenActionDropdown(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
                                    type="button"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                      Unpause Subscription
                                    </button>
                                    <button
                                    onClick={() => {
                                      handleEdit(subscription)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                                    type="button"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                      Edit Subscription
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
                  Showing {filteredSubscriptions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, filteredSubscriptions.length)} of{' '}
                  {filteredSubscriptions.length} records
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

      {/* Create Subscription Modal */}
      <CreateSubscriptionModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setCreateForm({ name: '', level: '1' })
        }}
        onCreate={handleCreate}
        form={createForm}
        setForm={setCreateForm}
      />

      {/* Delete All Modal */}
      <DeleteModal
        open={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={() => handleDelete()}
        loading={false}
        title="Delete All Subscriptions"
        message="Are you sure you want to delete all of your subscriptions? This cannot be undone."
      />

      {/* Edit Subscription Modal */}
      <EditSubscriptionModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSubscriptionToEdit(null)
          setEditForm({ name: '', level: '1' })
        }}
        onUpdate={handleUpdate}
        form={editForm}
        setForm={setEditForm}
        subscription={subscriptionToEdit}
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

const CreateSubscriptionModal: React.FC<{
  open: boolean
  onClose: () => void
  onCreate: () => void
  form: any
  setForm: (form: any) => void
}> = ({ open, onClose, onCreate, form, setForm }) => (
  <Modal open={open} onClose={onClose} title="Create A Subscription">
    <div className="space-y-4">
                <Input
                  label="Subscription Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter subscription name"
                  required
                />
                <Input
                  label="Subscription Level"
                  type="number"
        value={form.level}
        onChange={(e) => setForm({ ...form, level: e.target.value })}
                  placeholder="Enter level (e.g., 1)"
                  required
                />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} type="button">
                    Cancel
                  </Button>
        <Button onClick={onCreate} disabled={!form.name || !form.level}>
          Create Subscription
                </Button>
              </div>
            </div>
  </Modal>
)

const EditSubscriptionModal: React.FC<{
  open: boolean
  onClose: () => void
  onUpdate: () => void
  form: any
  setForm: (form: any) => void
  subscription: Subscription | null
}> = ({ open, onClose, onUpdate, form, setForm, subscription }) => {
  if (!subscription) return null
  return (
    <Modal open={open} onClose={onClose} title="Edit Subscription">
      <div className="space-y-4">
                <Input
                  label="Subscription Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter subscription name"
                  required
                />
                <Input
                  label="Subscription Level"
                  type="number"
          value={form.level}
          onChange={(e) => setForm({ ...form, level: e.target.value })}
                  placeholder="Enter level (e.g., 1)"
                  required
                />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={onUpdate} disabled={!form.name || !form.level}>
                    Update Subscription
                  </Button>
                </div>
              </div>
    </Modal>
  )
}

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

