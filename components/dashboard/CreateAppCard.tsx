'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CreateAppCardProps {
  onCreated?: () => void
}

export const CreateAppCard: React.FC<CreateAppCardProps> = ({ onCreated }) => {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to create app')
        return
      }

      setName('')
      onCreated?.()
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to create app')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-8 sm:p-10 lg:p-12 shadow-2xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-white/60 to-gray-50/60 dark:from-gray-900/60 dark:to-black/60">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-black/60 dark:text-white/60 mb-1">
              Get Started
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-black to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent tracking-tight">
              Create Your First Application
            </h2>
          </div>
        </div>
        <p className="text-base text-black/70 dark:text-white/70 font-medium leading-relaxed">
          Spin up a new app to unlock the application navigation and start building. You can add more applications later.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleCreate}>
        <div className="space-y-2">
          <Input
            label="Application name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter your application name..."
          />
        </div>
        {error && (
          <div className="rounded-xl border-2 border-red-500/50 bg-gradient-to-r from-red-500/10 to-red-600/10 dark:from-red-900/30 dark:to-red-800/30 text-red-700 dark:text-red-400 text-sm p-4 flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold mb-1">Error</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}
        <Button 
          type="submit" 
          className="w-full group relative overflow-hidden" 
          isLoading={isLoading} 
          disabled={!name.trim()}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Application
          </span>
        </Button>
      </form>
    </div>
  )
}

