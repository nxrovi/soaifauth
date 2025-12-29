'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { useToast } from '@/components/ui/Toast'

interface File {
  id: string
  filename: string
  url: string
  size: number
  uploadDate: Date
  authenticated: boolean
  createdAt: Date
}

interface FilesContentProps {
  user: {
    name?: string | null
    email: string
  }
  apps: { id: string; name: string }[]
  files: File[]
  currentAppId: string | null
}

export const FilesContent: React.FC<FilesContentProps> = ({
  user,
  apps,
  files: initialFiles,
  currentAppId,
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>(initialFiles)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(currentAppId || apps[0]?.id || null)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
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
    url: '',
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
      router.push('/dashboard/files')
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
    if (!selectedAppId || !createForm.url) {
      toast({
        variant: 'error',
        title: 'Missing fields',
        description: 'Please provide a file URL.',
      })
      return
    }

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          url: createForm.url,
          authenticated: createForm.authenticated,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to upload file')

      toast({
        variant: 'success',
        title: 'File uploaded',
        description: 'The file has been uploaded successfully.',
      })

      setShowCreateModal(false)
      setCreateForm({ url: '', authenticated: true })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to upload file',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleDelete = async (fileId?: string) => {
    if (!selectedAppId) return

    try {
      const res = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          fileId,
          fileIds: fileId ? undefined : selectedFiles,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to delete file')

      toast({
        variant: 'success',
        title: 'File deleted',
        description: fileId
          ? 'The file has been deleted successfully.'
          : `Successfully deleted ${data.deleted} file(s).`,
      })

      setShowDeleteAllModal(false)
      setSelectedFiles([])
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to delete file',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleToggleAuth = async (fileId: string, enable: boolean) => {
    if (!selectedAppId) return

    try {
      const res = await fetch('/api/files/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          fileId,
          enable,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update file')

      toast({
        variant: 'success',
        title: 'File updated',
        description: `Authentication has been ${enable ? 'enabled' : 'disabled'} successfully.`,
      })

      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to update file',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleCheckboxChange = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles([...selectedFiles, fileId])
    } else {
      setSelectedFiles(selectedFiles.filter((id) => id !== fileId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(filteredFiles.map((f) => f.id))
    } else {
      setSelectedFiles([])
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  // Filter and paginate files
  const filteredFiles = useMemo(() => {
    let filtered = files

    if (searchQuery) {
      filtered = filtered.filter(
        (file) =>
          file.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.url.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [files, searchQuery])

  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredFiles.slice(start, end)
  }, [filteredFiles, currentPage, pageSize])

  const totalPages = Math.ceil(filteredFiles.length / pageSize)

  // Handle click outside for action dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(actionDropdownRefs.current).forEach(([fileId, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          if (openActionDropdown === fileId) {
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
              Files
            </h1>
            <p className="text-xs text-black/60 dark:text-white/60">
              Let your users download files you upload here.{' '}
              <a
                href="https://keyauthdocs.apidog.io/dashboard/app/files"
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
                Please{' '}
                <a
                  href="https://youtu.be/WcdeI8QSRks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:no-underline text-blue-600 dark:text-blue-400"
                >
                  follow this guide
                </a>{' '}
                to upload files. FREE &amp; super easy!
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
                Upload File
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteAllModal(true)}
                className="flex items-center gap-2 !bg-red-500/10 hover:!bg-red-500/20 !text-red-600 dark:!text-red-400 !border-red-500/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete All Files
              </Button>
              {selectedFiles.length > 0 && (
                <div className="relative" ref={(el: HTMLDivElement | null) => { actionDropdownRefs.current['selection'] = el; }}>
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
                          Delete Selected
                        </button>
                        <button
                          onClick={() => {
                            selectedFiles.forEach((id) => handleToggleAuth(id, true))
                            setSelectedFiles([])
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                          type="button"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Turn on authenticated
                        </button>
                        <button
                          onClick={() => {
                            selectedFiles.forEach((id) => handleToggleAuth(id, false))
                            setSelectedFiles([])
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                          type="button"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  placeholder="Search files..."
                  className="w-48"
                />
              </div>
            </div>

            {/* Files Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      <Checkbox
                        checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                        onChange={(checked) => handleSelectAll(checked)}
                      />
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Filename
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      ID
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Size
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Upload Date
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
                  {paginatedFiles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-black/60 dark:text-white/60">
                        No files found. Upload your first file to get started.
                      </td>
                    </tr>
                  ) : (
                    paginatedFiles.map((file) => (
                      <tr
                        key={file.id}
                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedFiles.includes(file.id)}
                            onChange={(checked) => handleCheckboxChange(file.id, checked)}
                          />
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">{file.filename}</td>
                        <td className="px-4 py-3 font-mono text-xs text-black/70 dark:text-white/70">{file.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">{formatFileSize(file.size)}</td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">{formatDate(file.uploadDate)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`border text-xs font-medium px-2.5 py-0.5 rounded ${
                              file.authenticated
                                ? 'border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/10'
                                : 'border-red-500/50 text-red-600 dark:text-red-400 bg-red-500/10'
                            }`}
                          >
                            {file.authenticated ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative" ref={(el: HTMLDivElement | null) => { actionDropdownRefs.current[file.id] = el; }}>
                            <button
                              onClick={() =>
                                setOpenActionDropdown(
                                  openActionDropdown === file.id ? null : file.id
                                )
                              }
                              className="flex items-center gap-1.5 glass-input border border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 text-black dark:text-white font-semibold py-2 px-4 text-sm transition-all duration-200 hover:bg-white/80 dark:hover:bg-white/10 hover:border-black/30 dark:hover:border-white/30"
                              type="button"
                            >
                              <span>Actions</span>
                              <svg
                                className={`fill-current h-4 w-4 transition-transform duration-200 ${
                                  openActionDropdown === file.id ? 'rotate-180' : ''
                                }`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                style={{ marginTop: '3px' }}
                              >
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                              </svg>
                            </button>
                            {openActionDropdown === file.id && (
                              <div className="absolute z-50 right-0 mt-2 glass-card border border-black/20 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden animate-scale-in min-w-[180px]">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      handleDelete(file.id)
                                      setOpenActionDropdown(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                    type="button"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete File
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleToggleAuth(file.id, !file.authenticated)
                                      setOpenActionDropdown(null)
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                                    type="button"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {file.authenticated ? 'Turn off authenticated' : 'Turn on authenticated'}
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
                  Showing {filteredFiles.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, filteredFiles.length)} of {filteredFiles.length} records
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

      {/* Create File Modal */}
      {showCreateModal && (
        <div
          id="create-file-modal"
          tabIndex={-1}
          aria-hidden={!showCreateModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false)
              setCreateForm({ url: '', authenticated: true })
            }
          }}
        >
          <div className="glass-card no-hover border border-black/20 dark:border-white/20 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/5">
              <h3 className="text-lg font-bold text-black dark:text-white">Upload A New File</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateForm({ url: '', authenticated: true })
                }}
                className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 text-lg px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center p-4 text-amber-600 dark:text-amber-400 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30" role="alert">
                <svg className="flex-shrink-0 w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 0 0 1 0-2h1v-3H8a1 0 0 1 0-2h2a1 0 0 1 1 1v4h1a1 0 0 1 0 2Z" />
                </svg>
                <div className="ml-3 text-sm font-medium">
                  Please{' '}
                  <a
                    href="https://youtu.be/WcdeI8QSRks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline hover:no-underline text-blue-600 dark:text-blue-400"
                  >
                    follow this guide
                  </a>{' '}
                  to upload files. FREE &amp; super easy!
                </div>
              </div>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-black/70 dark:text-white/70 mb-2">
                    File Direct Download Link
                  </label>
                  <Input
                    type="text"
                    id="url"
                    name="url"
                    value={createForm.url}
                    onChange={(e) => setCreateForm({ ...createForm, url: e.target.value })}
                    placeholder="https://example.com/file.zip"
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <Checkbox
                    id="authed"
                    name="authed"
                    checked={createForm.authenticated}
                    onChange={(e) => setCreateForm({ ...createForm, authenticated: e.target.checked })}
                    label="Authenticated"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowCreateModal(false)
                      setCreateForm({ url: '', authenticated: true })
                    }}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" name="addfile">
                    Add File
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Files Modal */}
      <DeleteModal
        open={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={handleDelete}
        loading={false}
        title="Delete All Files"
        message="Are you sure you want to delete all of your files? This cannot be undone."
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

