'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/icons/Icon'

interface MobileSidebarProps {
  user?: {
    name?: string | null
    email?: string
    avatarUrl?: string | null
  }
  showAppNav?: boolean
}

interface NavItem {
  name: string
  href: string
  icon: string
}

const navGroups: Record<
  'app' | 'account',
  NavItem[]
> = {
  app: [
    { name: 'Licenses', href: '/dashboard/licenses', icon: 'key' },
    { name: 'Users', href: '/dashboard/users', icon: 'users' },
    { name: 'Tokens', href: '/dashboard/tokens', icon: 'tag' },
    { name: 'Subscriptions', href: '/dashboard/subscriptions', icon: 'crown' },
    { name: 'Chats', href: '/dashboard/chats', icon: 'chat' },
    { name: 'Sessions', href: '/dashboard/sessions', icon: 'time' },
    { name: 'Webhooks', href: '/dashboard/webhooks', icon: 'webhook' },
    { name: 'Files', href: '/dashboard/files', icon: 'file' },
    { name: 'Variables', href: '/dashboard/vars', icon: 'info' },
    { name: 'Logs', href: '/dashboard/logs', icon: 'database' },
    { name: 'Blacklists', href: '/dashboard/blacklists', icon: 'prohibited' },
    { name: 'Whitelists', href: '/dashboard/whitelists', icon: 'check' },
    { name: 'Settings', href: '/dashboard/app-settings', icon: 'tools' },
    { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: 'clipboard' },
  ],
  account: [
    { name: 'Upgrade', href: '/dashboard/upgrade', icon: 'payment' },
    { name: 'Account Settings', href: '/dashboard/account-settings', icon: 'tools' },
  ],
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ user, showAppNav = true }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'app' | 'account'>(showAppNav ? 'app' : 'account')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return 'U'
  }

  const displayName = user?.name || user?.email?.split('@')[0] || 'User'
  const planLabel = 'TESTER PLAN'

  const renderNavItems = (items: NavItem[]) =>
    items.map((item, index) => {
      const isActive = pathname === item.href
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => {
            setIsOpen(false)
            setIsDropdownOpen(false)
          }}
          style={{
            animation: `0.3s ease-out ${index * 0.05}s 1 normal backwards running slideInLeft`,
          }}
        >
          <button
            className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
              isActive
                ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white border border-black/20 dark:border-white/20 shadow-md scale-[1.02]'
                : 'text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white hover:scale-[1.02] hover:shadow-md'
            }`}
          >
            <div className="relative">
              <Icon
                name={item.icon}
                className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                  isActive ? 'scale-110 drop-shadow-lg' : 'group-hover:scale-125 group-hover:rotate-12'
                }`}
              />
              {isActive && <div className="absolute inset-0 w-5 h-5 bg-black/10 dark:bg-white/10 rounded-full blur-md" />}
            </div>
            <span className="font-semibold text-sm flex-1 text-left">{item.name}</span>
            {!isActive && <div className="w-0 h-0.5 bg-black/60 dark:bg-white/60 group-hover:w-2 transition-all duration-300 rounded-full" />}
            {isActive && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-black/60 dark:bg-white/60 animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-black/40 dark:bg-white/40 animate-pulse" style={{ animationDelay: '75ms' }} />
              </div>
            )}
          </button>
        </Link>
      )
    })

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-30 glass p-3 rounded-xl text-black dark:text-white hover:scale-110 transition-transform"
      >
        <span className="text-xl">☰</span>
      </button>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed left-0 top-0 h-full w-72 z-50 transform transition-all duration-300 ease-out overflow-hidden border-r border-black/10 dark:border-white/10 glass shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        suppressHydrationWarning
      >
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-white/10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04),transparent_50%)] pointer-events-none" />

        <div className="relative h-full flex flex-col">
          {/* Header Section */}
          <div className="relative p-5 md:p-6 border-b border-black/10 dark:border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-black/80 to-gray-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {getInitials(user?.name, user?.email)}
                  </div>
                )}
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold text-black dark:text-white leading-tight">{displayName}</h2>
                  <p className="text-xs text-black/50 dark:text-white/50">
                    <b>Expires:</b> Never
                  </p>
                </div>
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen((v) => !v)}
                  className="inline-block text-black/60 dark:text-white/60 hover:opacity-70 focus:ring-0 p-1.5"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={isDropdownOpen}
                >
                  <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 3">
                    <path d="M2 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6.041 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM14 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"></path>
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 z-50 text-sm list-none bg-black/70 backdrop-blur-md rounded-lg shadow-lg w-44 border border-white/10">
                    <ul className="py-2">
                      <li>
                        <Link
                          href="/dashboard/account-settings"
                          className="block px-4 py-2 text-white hover:bg-white/10/50 rounded-t-lg"
                          onClick={() => {
                            setIsDropdownOpen(false)
                            setIsOpen(false)
                          }}
                        >
                          Account Settings
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/api/auth/logout"
                          className="block px-4 py-2 text-red-400 hover:bg-white/10/50 hover:text-white rounded-b-lg"
                          onClick={() => {
                            setIsDropdownOpen(false)
                            setIsOpen(false)
                          }}
                        >
                          Log Out
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="md:hidden p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-all hover:scale-110 active:scale-95 hover:rotate-90 duration-300 ml-2"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-black dark:text-white"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 px-1">
              <p className="text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 text-xs font-black px-1.5 py-0.5 rounded border border-white/20 dark:border-white/15">
                {planLabel}
              </p>
            </div>
          </div>

          {/* Tabs */}
          {showAppNav && (
            <div className="mb-2 border-b border-[#0f0f17]/20 dark:border-white/10 px-4 pt-3">
              <ul className="grid grid-cols-2 text-sm font-medium text-center">
                  <li className="mr-1">
                    <button
                    className={`inline-block w-full p-3 rounded-t-lg transition-colors ${
                      activeTab === 'app'
                        ? 'text-black dark:text-white border-b-2 border-black/70 dark:border-white/70'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                      type="button"
                      onClick={() => setActiveTab('app')}
                    >
                      App
                    </button>
                  </li>
                <li className="ml-1">
                  <button
                  className={`inline-block w-full p-3 rounded-t-lg transition-colors ${
                    activeTab === 'account'
                      ? 'text-black dark:text-white border-b-2 border-black/70 dark:border-white/70'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                    type="button"
                    onClick={() => setActiveTab('account')}
                  >
                    Account
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Navigation Section */}
            <nav className="relative flex-1 p-4 space-y-1.5 overflow-y-auto">
              {showAppNav ? (
                <>
                  {activeTab === 'account' && renderNavItems(navGroups.account)}
                  {activeTab === 'app' && renderNavItems(navGroups.app)}
                </>
              ) : (
                renderNavItems(navGroups.account)
              )}
          </nav>

          {/* Footer Section */}
          <div className="relative p-4 border-t border-black/10 dark:border-white/10">
            <p className="text-xs text-black/50 dark:text-white/50 text-center hover:text-black dark:hover:text-white transition-colors">
              Created by{' '}
              <span className="font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                VenomAuth
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

