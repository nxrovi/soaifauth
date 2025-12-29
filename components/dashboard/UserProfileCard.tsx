'use client'

import { useState, useEffect, useRef } from 'react'

interface UserProfileCardProps {
  user?: {
    name?: string | null
    email?: string
    avatarUrl?: string | null
  }
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="w-full border border-black/20 dark:border-white/20 rounded-lg shadow-lg glass-card relative bg-[#0f0f17]/50 dark:bg-[#0f0f17]/50">
      <div className="flex justify-end px-3 pt-2 relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="text-black/60 dark:text-white/60 hover:opacity-60 focus:ring-0 p-1 transition-opacity"
          type="button"
        >
          <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 3">
            <path d="M2 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6.041 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM14 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"></path>
          </svg>
        </button>
        
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 top-10 right-2 text-xs sm:text-sm list-none bg-[#09090d] dark:bg-[#09090d] rounded-lg shadow-lg w-40 sm:w-44 border border-black/20 dark:border-white/10"
          >
            <ul className="py-1.5">
              <li>
                <a href="/dashboard/account-settings" className="block px-3 py-1.5 text-xs sm:text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  Account Settings
                </a>
              </li>
              <li>
                <a href="/api/auth/logout" className="block px-3 py-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-colors">
                  Log Out
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center px-3 pb-3 ml-4">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={displayName}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-lg flex-shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg mr-2 sm:mr-3 shadow-lg flex-shrink-0">
          {getInitials(user?.name, user?.email)}
        </div>
        )}
        <div className="flex flex-col flex-1 min-w-0 ml-2 sm:ml-4">
          <h5 className="text-sm sm:text-base font-medium text-blue-600 dark:text-blue-400 truncate ml-2 sm:ml-5">{displayName}</h5>
          <label className="text-xs text-black/50 dark:text-white/50">
            <b>Expires:</b> Never
          </label>
        </div>
      </div>
      <div className="px-3 pb-3">
        <p className="text-center text-transparent bg-clip-text bg-gradient-to-r to-blue-600 from-sky-400 text-xs font-black px-1.5 py-0.5 rounded border border-blue-500/30 dark:border-blue-400/30 mb-2">
          FREE PLAN
        </p>
      </div>
    </div>
  )
}

