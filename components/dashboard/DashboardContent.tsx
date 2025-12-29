'use client'

import { CreateAppCard } from '@/components/dashboard/CreateAppCard'
import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { useToast } from '@/components/ui/Toast'

interface DashboardContentProps {
  user: {
    name?: string | null
    email: string
    emailVerified: boolean
    avatarUrl?: string | null
  }
  apps: { id: string; name: string; ownerId: string; secret: string; status: string; version: string }[]
  selectedAppId: string | null
}

export const DashboardContent: React.FC<DashboardContentProps> = ({ user, apps, selectedAppId: initialSelectedAppId }) => {
  const router = useRouter()
  const { toast } = useToast()
  const [activeLang, setActiveLang] = useState<string>('JavaScript')
  const [selectedAppId, setSelectedAppId] = useState<string | null>(initialSelectedAppId)
  
  // Update selectedAppId when prop changes
  useEffect(() => {
    if (initialSelectedAppId) {
      setSelectedAppId(initialSelectedAppId)
    } else if (apps.length > 0 && !selectedAppId) {
      // Only set to first app if no app is currently selected
      setSelectedAppId(apps[0].id)
    }
  }, [initialSelectedAppId, apps])
  const [isBusy, setIsBusy] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createInput, setCreateInput] = useState('')
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameInput, setRenameInput] = useState('')
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const hasApps = apps.length > 0
  const currentApp = useMemo(() => {
    if (!hasApps) return null
    if (selectedAppId) {
      return apps.find((a) => a.id === selectedAppId) ?? apps[0]
    }
    return apps[0]
  }, [apps, hasApps, selectedAppId])

  const handleCreate = async (name: string) => {
    if (!name.trim()) {
      toast({
        variant: 'warning',
        title: 'Name required',
        description: 'Please give your application a name before continuing.',
      })
      return
    }
    setIsBusy(true)
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create app')
      setSelectedAppId(data.app?.id ?? null)
      toast({
        variant: 'success',
        title: 'Application created',
        description: 'Your application was created successfully.',
      })
      setShowCreateModal(false)
      setCreateInput('')
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to create app',
        description: e?.message || 'Something went wrong while creating your app.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleRename = async (name: string) => {
    if (!currentApp || !name.trim()) {
      toast({
        variant: 'warning',
        title: 'Enter a name',
        description: 'Please provide a new application name to continue.',
      })
      return
    }
    setIsBusy(true)
    try {
      const res = await fetch(`/api/apps/${currentApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to rename app')
      toast({
        variant: 'success',
        title: 'Application renamed',
        description: 'Your application name has been updated.',
      })
      setShowRenameModal(false)
      setRenameInput('')
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to rename app',
        description: e?.message || 'Please try again.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const openCreateModal = () => {
    setCreateInput('')
    setShowCreateModal(true)
  }

  const openRenameModal = () => {
    if (!currentApp) return
    setRenameInput(currentApp.name ?? '')
    setShowRenameModal(true)
  }

  const handleToggleStatus = async () => {
    if (!currentApp) return
    const nextStatus = currentApp.status === 'active' ? 'paused' : 'active'
    setIsBusy(true)
    try {
      const res = await fetch(`/api/apps/${currentApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-status', status: nextStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update status')
      toast({
        variant: 'success',
        title: nextStatus === 'active' ? 'Application resumed' : 'Application paused',
        description:
          nextStatus === 'active'
            ? 'Your application is live again.'
            : 'Your application and users are paused.',
      })
      setShowPauseModal(false)
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to update status',
        description: e?.message || 'Please try again.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleDelete = async (name: string) => {
    if (!currentApp) return
    if (name.trim() !== currentApp.name.trim()) {
      toast({
        variant: 'error',
        title: 'Name mismatch',
        description: 'The application name does not match. Please enter the exact name to confirm deletion.',
      })
      return
    }
    setIsBusy(true)
    try {
      const res = await fetch(`/api/apps/${currentApp.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to delete app')
      toast({
        variant: 'success',
        title: 'Application deleted',
        description: 'Your application has been permanently deleted.',
      })
      setShowDeleteModal(false)
      setDeleteInput('')
      setSelectedAppId(null)
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to delete app',
        description: e?.message || 'Please try again.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const openDeleteModal = () => {
    if (!currentApp) return
    setDeleteInput('')
    setShowDeleteModal(true)
  }

  const handleSelectApp = async (appId: string) => {
    setSelectedAppId(appId)
    try {
      await fetch('/api/apps/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to select app',
        description: e?.message || 'Something went wrong while selecting your app.',
      })
    }
  }


  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 transition-all duration-200 lg:ml-72">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="glass rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl animate-slide-up border-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-black via-gray-800 to-black dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent tracking-tight">
                  {hasApps ? 'Dashboard' : 'Create your first application'}
                </h1>
                <p className="text-sm sm:text-base text-black/70 dark:text-white/70 font-medium">
                  {hasApps
                    ? `Welcome back, ${user.name || user.email}! Manage your applications and credentials.`
                    : 'Spin up an app to unlock the application navigation and start building.'}
                </p>
              </div>
              {hasApps && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 dark:border-blue-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {apps.length} {apps.length === 1 ? 'Application' : 'Applications'}
                  </span>
                </div>
              )}
            </div>

            {hasApps && currentApp ? (
              <div className="space-y-6">
                {/* Application Header Card */}
                <div className="glass-card rounded-2xl p-6 sm:p-8 border border-black/5 dark:border-white/5 transition-all duration-300 animate-scale-in bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-900/50 dark:to-black/50">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-black/60 dark:text-white/60">
                          Application Credentials
                        </p>
                      </div>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-black to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent tracking-tight">
                        {currentApp.name}
                      </h2>
                      <div className="flex items-center gap-3 pt-2">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          currentApp.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            currentApp.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                          }`}></span>
                          {currentApp.status === 'active' ? 'Active' : 'Paused'}
                        </span>
                        <span className="text-xs text-black/50 dark:text-white/50 font-medium">
                          Version {currentApp.version}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <CredentialsTabs activeLang={activeLang} onChangeLang={setActiveLang} app={currentApp} />

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button 
                        variant="secondary" 
                        onClick={openCreateModal} 
                        isLoading={isBusy}
                        className="group relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create Application
                        </span>
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={openRenameModal} 
                        isLoading={isBusy} 
                        disabled={!currentApp}
                        className="group relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Rename
                        </span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setShowPauseModal(true)}
                        isLoading={isBusy}
                        disabled={!currentApp}
                        className="group relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {currentApp.status === 'active' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {currentApp.status === 'active' ? 'Pause' : 'Resume'}
                        </span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={openDeleteModal}
                        isLoading={isBusy}
                        disabled={!currentApp}
                        className="group relative overflow-hidden border-red-500/30 hover:border-red-500/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              ) : hasApps && !currentApp ? (
                <div className="glass-card rounded-2xl p-6 sm:p-8 border border-black/5 dark:border-white/5 bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-900/50 dark:to-black/50">
                  <p className="text-center text-black/60 dark:text-white/60">
                    Please select an application from the table below to view its details.
                  </p>
                </div>
              ) : (
                <CreateAppCard onCreated={() => {}} />
              )}
        </div>
        
        {/* Applications Table Card */}
        {hasApps && (
            <div className="glass-card rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-900/50 dark:to-black/50">
                  <div className="px-6 pt-6 pb-4 border-b border-black/10 dark:border-white/10 bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-black dark:text-white mb-1 flex items-center gap-2">
                          <svg className="w-5 h-5 text-black/60 dark:text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          Your Applications
                        </h3>
                        <p className="text-xs text-black/50 dark:text-white/50 font-medium mt-1">
                          Select an application to view its credentials and manage settings
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                          <th className="py-4 px-6 text-left text-xs font-bold text-black/70 dark:text-white/70 uppercase tracking-wider">
                            Application Name
                          </th>
                          <th className="py-4 px-6 text-left text-xs font-bold text-black/70 dark:text-white/70 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="py-4 px-6 text-left text-xs font-bold text-black/70 dark:text-white/70 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {apps.map((app) => {
                          const isActive = currentApp?.id === app.id
                          const status = app.status.charAt(0).toUpperCase() + app.status.slice(1)
                          return (
                            <tr
                              key={app.id}
                              className={`transition-all duration-200 cursor-pointer group ${
                                isActive
                                  ? 'bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border-l-4 border-blue-500'
                                  : 'hover:bg-black/5 dark:hover:bg-white/5 hover:border-l-4 hover:border-black/20 dark:hover:border-white/20 border-l-4 border-transparent'
                              }`}
                            >
                              <td className="py-5 px-6">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                                    isActive 
                                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                                      : 'bg-black/10 dark:bg-white/10 text-black dark:text-white group-hover:bg-black/20 dark:group-hover:bg-white/20'
                                  }`}>
                                    {app.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className={`text-sm font-semibold block ${
                                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-black dark:text-white'
                                    }`}>
                                      {app.name}
                                    </span>
                                    <span className="text-xs text-black/50 dark:text-white/50">
                                      Version {app.version}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-5 px-6">
                                <span
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    app.status === 'active'
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      app.status === 'active'
                                        ? 'bg-emerald-500 animate-pulse'
                                        : 'bg-amber-500'
                                    }`}
                                  ></span>
                                  {status}
                                </span>
                              </td>
                              <td className="py-5 px-6">
                                <label className="inline-flex items-center gap-3 cursor-pointer group/checkbox">
                                  <div className="relative">
                                    <input
                                      type="checkbox"
                                      name="selected-app"
                                      className="sr-only"
                                      checked={isActive}
                                      onChange={() => handleSelectApp(app.id)}
                                    />
                                    <div
                                      className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                                        isActive
                                          ? 'border-black dark:border-white bg-black dark:bg-white shadow-lg shadow-black/20 dark:shadow-white/20 scale-110'
                                          : 'border-black/30 dark:border-white/30 group-hover/checkbox:border-black/50 dark:group-hover/checkbox:border-white/50 bg-transparent group-hover/checkbox:bg-black/5 dark:group-hover/checkbox:bg-white/5'
                                      }`}
                                    >
                                      {isActive && (
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
                                  <span className={`text-sm font-medium transition-colors ${
                                    isActive 
                                      ? 'text-black dark:text-white' 
                                      : 'text-black/60 dark:text-white/60 group-hover/checkbox:text-black dark:group-hover/checkbox:text-white'
                                  }`}>
                                    {isActive ? 'Selected' : 'Select'}
                                  </span>
                                </label>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
        </div>
      </div>

      <CreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
        value={createInput}
        setValue={setCreateInput}
        loading={isBusy}
      />
      <RenameModal
        open={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        onRename={() => handleRename(renameInput)}
        value={renameInput}
        setValue={setRenameInput}
        loading={isBusy}
      />
      <PauseModal
        open={showPauseModal}
        onClose={() => setShowPauseModal(false)}
        onConfirm={handleToggleStatus}
        loading={isBusy}
        isActive={currentApp?.status === 'active'}
      />
      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={() => handleDelete(deleteInput)}
        value={deleteInput}
        setValue={setDeleteInput}
        loading={isBusy}
        appName={currentApp?.name ?? ''}
      />
    </>
  )
}

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

const CreateModal: React.FC<{
  open: boolean
  onClose: () => void
  onCreate: (name: string) => void
  value: string
  setValue: (v: string) => void
  loading: boolean
}> = ({ open, onClose, onCreate, value, setValue, loading }) => (
  <Modal open={open} onClose={onClose} title="Create a new app!">
    <Input
      label="Application name"
      placeholder="Application name"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
    <div className="flex justify-end gap-3 pt-2">
      <Button variant="secondary" onClick={onClose} type="button">
        Cancel
      </Button>
      <Button onClick={() => onCreate(value)} isLoading={loading} disabled={!value.trim()}>
        Create App
      </Button>
    </div>
  </Modal>
)


const RenameModal: React.FC<{
  open: boolean
  onClose: () => void
  onRename: () => void
  value: string
  setValue: (v: string) => void
  loading: boolean
}> = ({ open, onClose, onRename, value, setValue, loading }) => (
  <Modal open={open} onClose={onClose} title="Rename Application">
    <Input label="New name" placeholder="Application name" value={value} onChange={(e) => setValue(e.target.value)} />
    <div className="flex justify-end gap-3 pt-2">
      <Button variant="secondary" onClick={onClose} type="button">
        Cancel
      </Button>
      <Button onClick={onRename} isLoading={loading} disabled={!value.trim()}>
        Rename App
      </Button>
    </div>
  </Modal>
)

const PauseModal: React.FC<{
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  isActive: boolean
}> = ({ open, onClose, onConfirm, loading, isActive }) => (
  <Modal open={open} onClose={onClose} title={isActive ? 'Pause Application & Users' : 'Resume Application & Users'}>
    <div className={`rounded-xl border-2 ${
      isActive 
        ? 'border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-amber-600/10 dark:from-amber-900/30 dark:to-amber-800/30 text-amber-700 dark:text-amber-400' 
        : 'border-emerald-500/50 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 dark:from-emerald-900/30 dark:to-emerald-800/30 text-emerald-700 dark:text-emerald-400'
    } text-sm p-4 flex items-start gap-3`}>
      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isActive ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        )}
      </svg>
      <div>
        <p className="font-semibold mb-1">{isActive ? 'Pausing Application' : 'Resuming Application'}</p>
        <p className="text-xs opacity-90">
          {isActive
            ? 'Pausing your app and users will make your application unusable until you unpause it.'
            : 'Resume your application to make it usable again.'}
        </p>
      </div>
    </div>
    <p className="text-black/80 dark:text-white/80 text-sm font-medium">
      Are you sure you want to {isActive ? 'pause' : 'resume'} your application and users?
    </p>
    <div className="flex justify-end gap-3 pt-2">
      <Button variant="secondary" onClick={onClose} type="button">
        Cancel
      </Button>
      <Button onClick={onConfirm} isLoading={loading}>
        {isActive ? 'Pause Application' : 'Resume Application'}
      </Button>
    </div>
  </Modal>
)

const DeleteModal: React.FC<{
  open: boolean
  onClose: () => void
  onDelete: () => void
  value: string
  setValue: (v: string) => void
  loading: boolean
  appName: string
}> = ({ open, onClose, onDelete, value, setValue, loading, appName }) => (
  <Modal open={open} onClose={onClose} title="Delete Application">
    <div className="rounded-xl border-2 border-red-500/50 bg-gradient-to-r from-red-500/10 to-red-600/10 dark:from-red-900/30 dark:to-red-800/30 text-red-700 dark:text-red-400 text-sm p-4 flex items-start gap-3">
      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div>
        <p className="font-semibold mb-1">Warning: This action cannot be undone</p>
        <p className="text-xs opacity-90">
          Deleting your application will permanently remove it and all associated data. This action is irreversible.
        </p>
      </div>
    </div>
    <p className="text-black/80 dark:text-white/80 text-sm font-medium mb-2">
      To confirm deletion, please type the application name: <span className="font-bold text-black dark:text-white">{appName}</span>
    </p>
    <Input
      label="Application name"
      placeholder="Enter application name to confirm"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
    <div className="flex justify-end gap-3 pt-2">
      <Button variant="secondary" onClick={onClose} type="button">
        Cancel
      </Button>
      <Button 
        variant="secondary"
        onClick={onDelete} 
        isLoading={loading} 
        disabled={value.trim() !== appName.trim()}
        className="!bg-red-500/10 hover:!bg-red-500/20 dark:!bg-red-500/20 dark:hover:!bg-red-500/30 !text-red-600 dark:!text-red-400 !border-red-500/30 hover:!border-red-500/50 dark:!border-red-500/40 dark:hover:!border-red-500/60"
      >
        Delete Application
      </Button>
    </div>
  </Modal>
)

interface CredentialsTabsProps {
  activeLang: string
  onChangeLang: (lang: string) => void
  app: { name: string; ownerId: string; secret: string; version: string }
}

const credentials = (app: CredentialsTabsProps['app']) => [
  {
    lang: 'C#',
    code: `public static api VenomAuthApp = new api(\n    name: "${app.name}",\n    ownerid: "${app.ownerId}",\n    secret: "${app.secret}",\n    version: "${app.version}"\n);`,
  },
  {
    lang: 'C++',
    code: `VenomAuth::api VenomAuthApp(\n    "${app.name}",\n    "${app.ownerId}",\n    "${app.secret}",\n    "${app.version}"\n);`,
  },
  {
    lang: 'Python',
    code: `VenomAuthApp = api(\n    name="${app.name}",\n    ownerid="${app.ownerId}",\n    secret="${app.secret}",\n    version="${app.version}"\n)`,
  },
  {
    lang: 'PHP',
    code: `$VenomAuthApp = new VenomAuth\\api(\n    name: "${app.name}",\n    ownerid: "${app.ownerId}",\n    secret: "${app.secret}",\n    version: "${app.version}"\n);`,
  },
  {
    lang: 'JavaScript',
    code: `const VenomAuthApp = new VenomAuth({\n  name: "${app.name}",\n  ownerid: "${app.ownerId}",\n  secret: "${app.secret}",\n  version: "${app.version}",\n});`,
  },
  {
    lang: 'TypeScript',
    code: `const VenomAuthApp = new VenomAuth({\n  name: "${app.name}",\n  ownerid: "${app.ownerId}",\n  secret: "${app.secret}",\n  version: "${app.version}",\n});`,
  },
  {
    lang: 'Java',
    code: `VenomAuth.api VenomAuthApp = new VenomAuth.api(\n    "${app.name}",\n    "${app.ownerId}",\n    "${app.secret}",\n    "${app.version}"\n);`,
  },
  {
    lang: 'VB.Net',
    code: `Public Shared VenomAuthApp As New api(\n    name:="${app.name}",\n    ownerid:="${app.ownerId}",\n    secret:="${app.secret}",\n    version:="${app.version}"\n)`,
  },
  {
    lang: 'Rust',
    code: `let venom_auth_app = venom_auth::api::Api::new(\n    "${app.name}",\n    "${app.ownerId}",\n    "${app.secret}",\n    "${app.version}",\n    None,\n)?;`,
  },
  {
    lang: 'Go',
    code: `venomAuthApp := venomauth.New(\n    "${app.name}",\n    "${app.ownerId}",\n    "${app.secret}",\n    "${app.version}",\n    ""\n)`,
  },
  {
    lang: 'Lua',
    code: `VenomAuthApp = VenomAuth.api.new(\n    "${app.name}",\n    "${app.ownerId}",\n    "${app.secret}",\n    "${app.version}"\n)`,
  },
  {
    lang: 'Ruby',
    code: `venom_auth_app = VenomAuth::API.new(\n  name: "${app.name}",\n  ownerid: "${app.ownerId}",\n  secret: "${app.secret}",\n  version: "${app.version}"\n)`,
  },
  {
    lang: 'Perl',
    code: `my $venom_auth_app = VenomAuth::API->new(\n    name    => "${app.name}",\n    ownerid => "${app.ownerId}",\n    secret  => "${app.secret}",\n    version => "${app.version}",\n);`,
  },
];

const CredentialsTabs: React.FC<CredentialsTabsProps> = ({ activeLang, onChangeLang, app }) => {
  const list = credentials(app)
  const active = list.find((l) => l.lang === activeLang) ?? list[0]
  const { toast } = useToast()

  const handleCopy = async () => {
    if (!active) return
    try {
      await navigator.clipboard.writeText(active.code)
      toast({
        variant: 'success',
        title: 'Credentials copied',
        description: `${active.lang} snippet copied to your clipboard.`,
        duration: 2400,
      })
    } catch {
      toast({
        variant: 'error',
        title: 'Copy failed',
        description: 'Your browser blocked clipboard access.',
      })
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-gradient-to-br from-white/60 to-gray-50/60 dark:from-gray-900/60 dark:to-black/60">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <p className="text-sm font-semibold text-black/80 dark:text-white/80 uppercase tracking-wider">
            Integration Code
          </p>
        </div>
        <p className="text-xs text-black/60 dark:text-white/60 font-medium">
          Copy and paste this code into your application to get started
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {list.map((item) => (
          <button
            key={item.lang}
            onClick={() => onChangeLang(item.lang)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-200 ${
              activeLang === item.lang
                ? 'bg-black dark:bg-white text-white dark:text-black border-black/20 dark:border-white/20 shadow-lg scale-105'
                : 'glass-input text-black/70 dark:text-white/70 border-black/20 dark:border-white/20 hover:border-black/30 dark:hover:border-white/30 hover:bg-black/5 dark:hover:bg-white/5 hover:scale-105'
            }`}
            type="button"
          >
            {item.lang}
          </button>
        ))}
      </div>

      {active && (
        <div className="rounded-xl border border-black/20 dark:border-white/20 bg-black dark:bg-black p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                {active.lang} Snippet
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg bg-white text-black hover:bg-white/90 transition-all duration-200 text-xs font-semibold shadow-lg hover:scale-105 flex items-center gap-2 border border-white/20"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Code
            </button>
          </div>
          <pre className="text-[11px] sm:text-xs text-emerald-400 bg-black p-4 rounded-lg overflow-x-auto whitespace-pre-wrap border border-emerald-500/20 font-mono leading-relaxed">
            {active.code}
          </pre>
        </div>
      )}
    </div>
  )
}

