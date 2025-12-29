'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

type AccountSettingsProps = {
  user: {
    name?: string | null
    email: string
    avatarUrl?: string | null
  }
}

type ToggleProps = {
  label: string
  description?: string
  value: boolean
  onChange: (value: boolean) => void
  storageKey: string
}

const Toggle: React.FC<ToggleProps> = ({ label, description, value, onChange, storageKey }) => {
  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored !== null) {
      onChange(stored === 'true')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  useEffect(() => {
    localStorage.setItem(storageKey, String(value))
  }, [storageKey, value])

  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-[#0f0f17]/60">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{label}</p>
        {description && <p className="text-xs text-white/60">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-white/20'
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
            value ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ user }) => {
  const { toast } = useToast()
  const [name, setName] = useState(user.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name ?? '',
          avatarUrl: avatarUrl ?? '',
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update settings')
      }

      toast({
        variant: 'success',
        title: 'Account updated',
        description: 'Your account settings have been saved.',
      })
    } catch (error: any) {
      toast({
        variant: 'error',
        title: 'Unable to save',
        description: error?.message || 'Something went wrong while saving your settings.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-white/70">
        <Link href="/dashboard" className="hover:text-white transition">
          Dashboard
        </Link>
        <span className="opacity-50">/</span>
        <span className="text-white">Account Settings</span>
      </div>

      <div className="glass rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-red-400 flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              You don&apos;t have a subscription!
              <Link href="/dashboard/upgrade" className="text-blue-400 hover:text-blue-200 font-semibold">
                Upgrade now
              </Link>
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mt-3">Account Settings</h1>
            <p className="text-sm text-white/60 mt-1">Manage your account preferences and profile details.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name || user.email}
                className="w-12 h-12 rounded-full object-cover border border-white/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {(name || user.email)?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <p className="text-xs text-white/60">Signed in as</p>
              <p className="text-sm text-white font-semibold truncate max-w-[14rem]">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Email" value={user.email} readOnly />
          <Input
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <Input
            label="Profile Picture URL"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
          />
          <Input label="Subscription Expires" value="Never" readOnly />
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <Button variant="secondary" onClick={() => window.location.href = '/forgot'} type="button">
            Change Password
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Settings
          </Button>
        </div>

        <div className="mt-8 p-5 rounded-2xl border border-white/10 bg-[#0f0f17]/60">
          <h2 className="text-lg font-semibold text-white mb-2">Security Words</h2>
          <p className="text-sm text-white/70">
            Store your recovery words in a safe place. These are shown once and cannot be regenerated without admin help.
          </p>
          <p className="text-xs text-white/50 mt-2">
            Tip: keep a copy on encrypted storage and avoid naming it something obvious.
          </p>
        </div>
      </div>
    </div>
  )
}


