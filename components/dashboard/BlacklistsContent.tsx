'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'

interface Blacklist {
  id: string
  data: string
  type: 'IP Address' | 'Hardware ID' | 'region' | 'country' | 'asn'
  reason: string
  createdAt: Date
}

interface BlacklistsContentProps {
  user: {
    name?: string | null
    email: string
  }
  apps: { id: string; name: string }[]
  blacklists: Blacklist[]
  currentAppId: string | null
}

const blacklistTypeOptions = [
  { value: 'IP Address', label: 'IP Address' },
  { value: 'Hardware ID', label: 'Hardware ID' },
  { value: 'region', label: 'Region/State' },
  { value: 'country', label: 'Country Code' },
  { value: 'asn', label: 'ASN Number' },
]

const getPlaceholder = (type: string) => {
  switch (type) {
    case 'IP Address':
      return 'IP Address (example: 142.250.64.206)'
    case 'Hardware ID':
      return 'Hardware ID (example: S-1-5-21-1085031214-1563985344-725345543)'
    case 'region':
      return 'Region/State (example: ENG for England)'
    case 'country':
      return 'Country Code (example: IT for Italy)'
    case 'asn':
      return 'ASN Number (example: 15169 for Google LLC)'
    default:
      return ''
  }
}

export const BlacklistsContent: React.FC<BlacklistsContentProps> = ({
  user,
  apps,
  blacklists: initialBlacklists,
  currentAppId,
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const [blacklists, setBlacklists] = useState<Blacklist[]>(initialBlacklists)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(currentAppId || apps[0]?.id || null)
  const [selectedBlacklists, setSelectedBlacklists] = useState<string[]>([])
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
    type: 'IP Address' as Blacklist['type'],
    data: '',
    reason: '',
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
      router.push('/dashboard/blacklists')
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
    if (!selectedAppId || !createForm.data || !createForm.reason) {
      toast({
        variant: 'error',
        title: 'Missing fields',
        description: 'Please provide blacklist data and reason.',
      })
      return
    }

    try {
      const res = await fetch('/api/blacklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          type: createForm.type,
          data: createForm.data,
          reason: createForm.reason,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create blacklist')

      toast({
        variant: 'success',
        title: 'Blacklist created',
        description: 'The blacklist entry has been created successfully.',
      })

      setShowCreateModal(false)
      setCreateForm({ type: 'IP Address', data: '', reason: '' })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to create blacklist',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleDelete = async (blacklistId?: string) => {
    if (!selectedAppId) return

    try {
      const res = await fetch('/api/blacklists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          blacklistId,
          blacklistIds: blacklistId ? undefined : selectedBlacklists,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to delete blacklist')

      toast({
        variant: 'success',
        title: 'Blacklist deleted',
        description: blacklistId
          ? 'The blacklist entry has been deleted successfully.'
          : `Successfully deleted ${data.deleted} blacklist(s).`,
      })

      setShowDeleteAllModal(false)
      setSelectedBlacklists([])
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to delete blacklist',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleCheckboxChange = (blacklistId: string, checked: boolean) => {
    if (checked) {
      setSelectedBlacklists([...selectedBlacklists, blacklistId])
    } else {
      setSelectedBlacklists(selectedBlacklists.filter((id) => id !== blacklistId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBlacklists(filteredBlacklists.map((b) => b.id))
    } else {
      setSelectedBlacklists([])
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  // Filter and paginate blacklists
  const filteredBlacklists = useMemo(() => {
    let filtered = blacklists

    if (searchQuery) {
      filtered = filtered.filter(
        (blacklist) =>
          blacklist.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          blacklist.data.toLowerCase().includes(searchQuery.toLowerCase()) ||
          blacklist.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          blacklist.reason.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [blacklists, searchQuery])

  const paginatedBlacklists = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredBlacklists.slice(start, end)
  }, [filteredBlacklists, currentPage, pageSize])

  const totalPages = Math.ceil(filteredBlacklists.length / pageSize)

  // Handle click outside for action dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(actionDropdownRefs.current).forEach(([blacklistId, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          if (openActionDropdown === blacklistId) {
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
              Blacklists
            </h1>
            <p className="text-xs text-black/60 dark:text-white/60">
              Block access from certain users based on different types.{' '}
              <a
                href="https://keyauthdocs.apidog.io/dashboard/app/blacklists"
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
                  Create Blacklist
              </Button>
              <Button
                variant="secondary"
                  onClick={() => setShowDeleteAllModal(true)}
                className="flex items-center gap-2 !bg-red-500/10 hover:!bg-red-500/20 !text-red-600 dark:!text-red-400 !border-red-500/30"
                >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete All Blacklists
              </Button>
                {selectedBlacklists.length > 0 && (
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
                  placeholder="Search blacklists..."
                  className="w-48"
                            />
                        </div>
                      </div>

            {/* Blacklists Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                        <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      <div className="relative inline-block">
                              <input
                                type="checkbox"
                                checked={selectedBlacklists.length === filteredBlacklists.length && filteredBlacklists.length > 0}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center cursor-pointer ${
                            selectedBlacklists.length === filteredBlacklists.length && filteredBlacklists.length > 0
                              ? 'border-black dark:border-white bg-black dark:bg-white shadow-lg shadow-black/20 dark:shadow-white/20 scale-110'
                              : 'border-black/30 dark:border-white/30 bg-transparent hover:border-black/50 dark:hover:border-white/50 hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            handleSelectAll(selectedBlacklists.length !== filteredBlacklists.length || filteredBlacklists.length === 0)
                          }}
                        >
                          {selectedBlacklists.length === filteredBlacklists.length && filteredBlacklists.length > 0 && (
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
                              Blacklist Data
                            </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                              Blacklist Type
                            </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                              Reason
                            </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                              Actions
                            </th>
                          </tr>
                        </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                          {paginatedBlacklists.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-black/60 dark:text-white/60">
                        {searchQuery ? 'No blacklists found matching your search.' : 'No blacklists found. Create your first blacklist to get started.'}
                              </td>
                            </tr>
                          ) : (
                    paginatedBlacklists.map((blacklist) => (
                      <tr
                        key={blacklist.id}
                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="relative inline-block">
                                  <input
                                    type="checkbox"
                                    checked={selectedBlacklists.includes(blacklist.id)}
                                    onChange={(e) => handleCheckboxChange(blacklist.id, e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center cursor-pointer ${
                                selectedBlacklists.includes(blacklist.id)
                                  ? 'border-black dark:border-white bg-black dark:bg-white shadow-lg shadow-black/20 dark:shadow-white/20 scale-110'
                                  : 'border-black/30 dark:border-white/30 bg-transparent hover:border-black/50 dark:hover:border-white/50 hover:bg-black/5 dark:hover:bg-white/5'
                              }`}
                              onClick={(e) => {
                                e.preventDefault()
                                handleCheckboxChange(blacklist.id, !selectedBlacklists.includes(blacklist.id))
                              }}
                            >
                              {selectedBlacklists.includes(blacklist.id) && (
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
                          {blacklist.data}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {blacklist.type}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {blacklist.reason}
                                </td>
                        <td className="px-4 py-3">
                          <div className="relative" ref={(el) => { actionDropdownRefs.current[blacklist.id] = el }}>
                                    <button
                              onClick={() => setOpenActionDropdown(openActionDropdown === blacklist.id ? null : blacklist.id)}
                              className="flex items-center gap-1.5 glass-input border border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 text-black dark:text-white font-semibold py-2 px-4 text-sm transition-all duration-200 hover:bg-white/80 dark:hover:bg-white/10 hover:border-black/30 dark:hover:border-white/30"
                              type="button"
                            >
                              <span>Actions</span>
                              <svg
                                className={`fill-current h-4 w-4 transition-transform duration-200 ${
                                  openActionDropdown === blacklist.id ? 'rotate-180' : ''
                                }`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                style={{ marginTop: '3px' }}
                              >
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                                      </svg>
                                    </button>
                                    {openActionDropdown === blacklist.id && (
                              <div className="absolute z-50 right-0 mt-2 glass-card border border-black/20 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden animate-scale-in min-w-[180px]">
                                <div className="py-1">
                                            <button
                                    onClick={() => {
                                      handleDelete(blacklist.id)
                                      setOpenActionDropdown(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                    type="button"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                              Delete Blacklist
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
                  Showing {filteredBlacklists.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, filteredBlacklists.length)} of{' '}
                  {filteredBlacklists.length} records
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

      {/* Add To Blacklist Modal */}
      <CreateBlacklistModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setCreateForm({ type: 'IP Address', data: '', reason: '' })
        }}
        onCreate={handleCreate}
        form={createForm}
        setForm={setCreateForm}
        getPlaceholder={getPlaceholder}
        blacklistTypeOptions={blacklistTypeOptions}
      />

      {/* Delete All Modal */}
      <DeleteModal
        open={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={() => handleDelete()}
        loading={false}
        title="Delete All Blacklists"
        message="Are you sure you want to delete all of your blacklists? This cannot be undone."
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

const CreateBlacklistModal: React.FC<{
  open: boolean
  onClose: () => void
  onCreate: () => void
  form: any
  setForm: (form: any) => void
  getPlaceholder: (type: string) => string
  blacklistTypeOptions: { value: string; label: string }[]
}> = ({ open, onClose, onCreate, form, setForm, getPlaceholder, blacklistTypeOptions }) => (
  <Modal open={open} onClose={onClose} title="Add Blacklist">
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onCreate()
      }}
    >
      <Select
        label="Blacklist Type"
        value={form.type}
        onChange={(value) => {
          setForm({
            ...form,
            type: value as Blacklist['type'],
            data: '', // Clear data when type changes
          })
        }}
      >
        {blacklistTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Input
        label="Enter blacklist data"
        value={form.data}
        onChange={(e) => setForm({ ...form, data: e.target.value })}
        placeholder={getPlaceholder(form.type)}
        required
      />
      <Input
        label="Reason"
        value={form.reason}
        onChange={(e) => setForm({ ...form, reason: e.target.value })}
        placeholder="Enter reason"
        required
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button type="submit" disabled={!form.data || !form.reason}>
          Blacklist
        </Button>
      </div>
    </form>
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

