'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

interface AppSelectionContentProps {
  user: {
    name?: string | null
    email: string
    emailVerified: boolean
    avatarUrl?: string | null
  }
  apps: { id: string; name: string; status: string }[]
}

export const AppSelectionContent: React.FC<AppSelectionContentProps> = ({ user, apps }) => {
  const router = useRouter()
  const { toast } = useToast()
  const [isBusy, setIsBusy] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createInput, setCreateInput] = useState('')

  const handleSelectApp = async (appId: string) => {
    setIsBusy(true)
    try {
      const res = await fetch('/api/apps/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to select app')
      router.push('/dashboard')
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to select app',
        description: e?.message || 'Something went wrong while selecting your app.',
      })
    } finally {
      setIsBusy(false)
    }
  }

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

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 transition-all duration-200 lg:ml-72">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Application Example Section */}
          <div className="row">
            <div className="col-xxl-12">
              <h5 className="mb-3 text-xl font-bold text-black dark:text-white">Application Example</h5>
              <div className="glass-card rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-900/50 dark:to-black/50">
                <div className="card-body p-6">
                  <div className="alert alert-warning rounded-xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-amber-600/10 dark:from-amber-900/30 dark:to-amber-800/30 text-amber-700 dark:text-amber-400 p-4" role="alert">
                    <div className="space-y-2">
                      <div>
                        <strong>Example Files:</strong>{' '}
                        <a href="https://files.licenseauth.online" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-800 dark:hover:text-amber-300">
                          https://files.licenseauth.online
                        </a>
                      </div>
                      <div>
                        <strong>Videos:</strong>{' '}
                        <a href="https://videos.licenseauth.online" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-800 dark:hover:text-amber-300">
                          https://videos.licenseauth.online
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Create New App Button */}
          <div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn btn-secondary w-lg waves-effect waves-light px-6 py-3 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New App
            </button>
          </div>

          <br />
          <br />

          {/* All Applications Table */}
          <div className="row">
            <div className="col-lg-12">
              <div className="glass-card rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-900/50 dark:to-black/50">
                <div className="card-header align-items-center d-flex px-6 py-4 border-b border-black/10 dark:border-white/10 bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/5">
                  <h4 className="card-title mb-0 flex-grow-1 text-xl font-bold text-black dark:text-white">All Application</h4>
                </div>

                <div className="card-body p-6">
                  <div className="table-responsive table-card">
                    <table className="table table-hover table-borderless table-centered align-middle table-nowrap mb-0 w-full">
                      <thead className="text-muted bg-light-subtle">
                        <tr className="border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                          <th className="py-4 px-6 text-left text-xs font-bold text-black/70 dark:text-white/70 uppercase tracking-wider">Application Name</th>
                          <th className="py-4 px-6 text-left text-xs font-bold text-black/70 dark:text-white/70 uppercase tracking-wider">App Status</th>
                          <th className="py-4 px-6 text-left text-xs font-bold text-black/70 dark:text-white/70 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {apps.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-8 px-6 text-center text-black/60 dark:text-white/60">
                              No applications found. Create your first application to get started.
                            </td>
                          </tr>
                        ) : (
                          apps.map((app) => {
                            const status = app.status.charAt(0).toUpperCase() + app.status.slice(1)
                            const isActive = app.status === 'active'
                            return (
                              <tr key={app.id} className="transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5">
                                <td className="py-5 px-6">
                                  <div className="text-sm font-semibold text-black dark:text-white">{app.name}</div>
                                </td>
                                <td className="py-5 px-6">
                                  <span
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                      isActive
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                                      }`}
                                    ></span>
                                    {status}
                                  </span>
                                </td>
                                <td className="py-5 px-6">
                                  <form method="POST" onSubmit={(e) => { e.preventDefault(); handleSelectApp(app.id); }}>
                                    <button
                                      type="submit"
                                      disabled={isBusy}
                                      className="btn rounded-pill btn-dark waves-effect waves-light px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-semibold hover:bg-black/80 dark:hover:bg-white/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <span className="ml-2">Select</span>
                                    </button>
                                  </form>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create App Modal */}
      {showCreateModal && (
        <CreateModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          value={createInput}
          setValue={setCreateInput}
          loading={isBusy}
        />
      )}
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
  <Modal open={open} onClose={onClose} title="Create Application">
    <Input
      label="Application name"
      placeholder="Enter App Name"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      autoComplete="on"
      required
    />
    <div className="flex justify-end gap-2">
      <Button variant="secondary" onClick={onClose} type="button">
        Close
      </Button>
      <Button onClick={() => onCreate(value)} isLoading={loading} disabled={!value.trim()}>
        Create
      </Button>
    </div>
  </Modal>
)

