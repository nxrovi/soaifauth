'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'

interface Webhook {
  id: string
  name: string | null
  endpoint: string
  userAgent: string
  authenticated: boolean
  createdAt: Date
}

interface WebhooksContentProps {
  user: {
    name?: string | null
    email: string
  }
  apps: { id: string; name: string }[]
  webhooks: Webhook[]
  currentAppId: string | null
}

export const WebhooksContent: React.FC<WebhooksContentProps> = ({
  user,
  apps,
  webhooks: initialWebhooks,
  currentAppId,
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(currentAppId || apps[0]?.id || null)
  const [selectedWebhooks, setSelectedWebhooks] = useState<string[]>([])
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null)
  const actionDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Table states
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    endpoint: '',
    userAgent: '',
    authenticated: true,
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
      router.push('/dashboard/webhooks')
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
    if (!selectedAppId || !createForm.endpoint) {
      toast({
        variant: 'error',
        title: 'Missing fields',
        description: 'Please fill in the webhook endpoint.',
      })
      return
    }

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          name: createForm.name || null,
          endpoint: createForm.endpoint,
          userAgent: createForm.userAgent || 'KeyAuth',
          authenticated: createForm.authenticated,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create webhook')

      toast({
        variant: 'success',
        title: 'Webhook created',
        description: 'The webhook has been created successfully.',
      })

      setShowCreateModal(false)
      setCreateForm({ name: '', endpoint: '', userAgent: '', authenticated: true })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to create webhook',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleDelete = async (webhookId?: string) => {
    if (!selectedAppId) return

    try {
      const res = await fetch('/api/webhooks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          webhookId,
          webhookIds: webhookId ? undefined : selectedWebhooks,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to delete webhook')

      toast({
        variant: 'success',
        title: 'Webhook deleted',
        description: webhookId
          ? 'The webhook has been deleted successfully.'
          : `Successfully deleted ${data.deleted} webhook(s).`,
      })

      setShowDeleteAllModal(false)
      setSelectedWebhooks([])
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to delete webhook',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleToggleAuth = async (webhookId: string, enable: boolean) => {
    if (!selectedAppId) return

    try {
      const res = await fetch('/api/webhooks/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          webhookId,
          enable,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update webhook')

      toast({
        variant: 'success',
        title: 'Webhook updated',
        description: `Authentication has been ${enable ? 'enabled' : 'disabled'} successfully.`,
      })

      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to update webhook',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleCheckboxChange = (webhookId: string, checked: boolean) => {
    if (checked) {
      setSelectedWebhooks([...selectedWebhooks, webhookId])
    } else {
      setSelectedWebhooks(selectedWebhooks.filter((id) => id !== webhookId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWebhooks(filteredWebhooks.map((w) => w.id))
    } else {
      setSelectedWebhooks([])
    }
  }

  // Filter and paginate webhooks
  const filteredWebhooks = useMemo(() => {
    let filtered = webhooks

    if (searchQuery) {
      filtered = filtered.filter(
        (webhook) =>
          webhook.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          webhook.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (webhook.name && webhook.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          webhook.userAgent.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [webhooks, searchQuery])

  const paginatedWebhooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredWebhooks.slice(start, end)
  }, [filteredWebhooks, currentPage, pageSize])

  const totalPages = Math.ceil(filteredWebhooks.length / pageSize)

  // Handle click outside for action dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(actionDropdownRefs.current).forEach(([webhookId, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          if (openActionDropdown === webhookId) {
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
              Webhooks
            </h1>
            <p className="text-xs text-black/60 dark:text-white/60">
                  Send and receive secure requests.{' '}
                  <a
                    href="https://keyauthdocs.apidog.io/dashboard/app/webhooks"
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
            {/* Alert Box */}
            <div className="flex items-center p-4 mb-4 text-amber-600 dark:text-amber-400 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30" role="alert">
              <svg className="flex-shrink-0 w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 0 0 1 0-2h1v-3H8a1 0 0 1 0-2h2a1 0 0 1 1 1v4h1a1 0 0 1 0 2Z" />
              </svg>
              <div className="ml-3 text-sm font-medium">
                People often mistake this for Discord webhooks. Please view our{' '}
                <a
                  href="https://keyauthdocs.apidog.io/api/features/webhook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:no-underline text-blue-600 dark:text-blue-400"
                >
                  Documentation
                </a>{' '}
                to learn how to send Discord webhooks.
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Webhook
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteAllModal(true)}
                className="flex items-center gap-2 !bg-red-500/10 hover:!bg-red-500/20 !text-red-600 dark:!text-red-400 !border-red-500/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete All Webhooks
              </Button>
              {selectedWebhooks.length > 0 && (
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
                              selectedWebhooks.forEach((id) => handleToggleAuth(id, true))
                              setSelectedWebhooks([])
                            setOpenActionDropdown(null)
                            }}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-colors flex items-center gap-2"
                          type="button"
                          >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                            Turn on authenticated
                          </button>
                          <button
                            onClick={() => {
                              selectedWebhooks.forEach((id) => handleToggleAuth(id, false))
                              setSelectedWebhooks([])
                            setOpenActionDropdown(null)
                            }}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 transition-colors flex items-center gap-2"
                          type="button"
                          >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                            Turn off authenticated
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
                  placeholder="Search webhooks..."
                  className="w-48"
                />
              </div>
            </div>

            {/* Webhooks Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      <div className="relative inline-block">
                      <input
                        type="checkbox"
                        checked={selectedWebhooks.length === filteredWebhooks.length && filteredWebhooks.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center cursor-pointer ${
                            selectedWebhooks.length === filteredWebhooks.length && filteredWebhooks.length > 0
                              ? 'border-black dark:border-white bg-black dark:bg-white shadow-lg shadow-black/20 dark:shadow-white/20 scale-110'
                              : 'border-black/30 dark:border-white/30 bg-transparent hover:border-black/50 dark:hover:border-white/50 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            handleSelectAll(selectedWebhooks.length !== filteredWebhooks.length || filteredWebhooks.length === 0)
                          }}
                        >
                          {selectedWebhooks.length === filteredWebhooks.length && filteredWebhooks.length > 0 && (
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
                      ID
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Endpoint
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      User-Agent
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Authenticated
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {paginatedWebhooks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-black/60 dark:text-white/60">
                        {searchQuery ? 'No webhooks found matching your search.' : 'No data available in table'}
                      </td>
                    </tr>
                  ) : (
                    paginatedWebhooks.map((webhook) => (
                      <tr
                        key={webhook.id}
                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="relative inline-block">
                          <input
                            type="checkbox"
                            checked={selectedWebhooks.includes(webhook.id)}
                            onChange={(e) => handleCheckboxChange(webhook.id, e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center cursor-pointer ${
                                selectedWebhooks.includes(webhook.id)
                                  ? 'border-black dark:border-white bg-black dark:bg-white shadow-lg shadow-black/20 dark:shadow-white/20 scale-110'
                                  : 'border-black/30 dark:border-white/30 bg-transparent hover:border-black/50 dark:hover:border-white/50 hover:bg-black/5 dark:hover:bg-white/5'
                              }`}
                              onClick={(e) => {
                                e.preventDefault()
                                handleCheckboxChange(webhook.id, !selectedWebhooks.includes(webhook.id))
                              }}
                            >
                              {selectedWebhooks.includes(webhook.id) && (
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
                          {webhook.id.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 font-mono text-xs max-w-md truncate text-black/70 dark:text-white/70">
                          {webhook.endpoint}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {webhook.userAgent || 'KeyAuth'}
                        </td>
                        <td className="px-4 py-3">
                          {webhook.authenticated ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              Yes
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                              No
                          </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative" ref={(el) => { actionDropdownRefs.current[webhook.id] = el }}>
                            <button
                              onClick={() => setOpenActionDropdown(openActionDropdown === webhook.id ? null : webhook.id)}
                              className="flex items-center gap-1.5 glass-input border border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 text-black dark:text-white font-semibold py-2 px-4 text-sm transition-all duration-200 hover:bg-white/80 dark:hover:bg-white/10 hover:border-black/30 dark:hover:border-white/30"
                              type="button"
                            >
                              <span>Actions</span>
                              <svg
                                className={`fill-current h-4 w-4 transition-transform duration-200 ${
                                  openActionDropdown === webhook.id ? 'rotate-180' : ''
                                }`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                style={{ marginTop: '3px' }}
                              >
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                              </svg>
                            </button>
                            {openActionDropdown === webhook.id && (
                              <div className="absolute z-50 right-0 mt-2 glass-card border border-black/20 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden animate-scale-in min-w-[180px]">
                                <div className="py-1">
                                    <button
                                    onClick={() => {
                                      handleDelete(webhook.id)
                                      setOpenActionDropdown(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                    type="button"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                      Delete Webhook
                                    </button>
                                    <button
                                    onClick={() => {
                                      handleToggleAuth(webhook.id, !webhook.authenticated)
                                      setOpenActionDropdown(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                                    type="button"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                      {webhook.authenticated ? 'Turn off authenticated' : 'Turn on authenticated'}
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
                  Showing {filteredWebhooks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, filteredWebhooks.length)} of{' '}
                  {filteredWebhooks.length} records
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

      {/* Create Webhook Modal */}
      <CreateWebhookModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setCreateForm({ name: '', endpoint: '', userAgent: '', authenticated: true })
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
        title="Delete All Webhooks"
        message="Are you sure you want to delete all of your webhooks? This cannot be undone."
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

const CreateWebhookModal: React.FC<{
  open: boolean
  onClose: () => void
  onCreate: () => void
  form: any
  setForm: (form: any) => void
}> = ({ open, onClose, onCreate, form, setForm }) => (
  <Modal open={open} onClose={onClose} title="Generate A Webhook">
    <div className="space-y-4">
      <Input
        label="Webhook Name (optional)"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Enter webhook name"
      />
      <Input
        label="Webhook Endpoint"
        value={form.endpoint}
        onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
        placeholder="Enter endpoint URL"
        required
      />
      <Input
        label="User Agent (Default is KeyAuth)"
        value={form.userAgent}
        onChange={(e) => setForm({ ...form, userAgent: e.target.value })}
        placeholder="Enter user agent"
      />
      <Checkbox
        label="Authenticated"
        checked={form.authenticated}
        onChange={(e) => setForm({ ...form, authenticated: e.target.checked })}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button onClick={onCreate} disabled={!form.endpoint}>
          Generate Webhook
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

