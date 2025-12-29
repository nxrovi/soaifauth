'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

interface Token {
  id: string
  token: string
  assigned: string | null
  banned: boolean
  banReason: string | null
  hash: string | null
  type: string
  status: string | null
  createdAt: Date
}

interface TokensContentProps {
  user: {
    name?: string | null
    email: string
  }
  apps: { id: string; name: string }[]
  tokens: Token[]
  currentAppId: string | null
}

export const TokensContent: React.FC<TokensContentProps> = ({
  user,
  apps,
  tokens: initialTokens,
  currentAppId,
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const [tokens, setTokens] = useState<Token[]>(initialTokens)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(currentAppId || apps[0]?.id || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

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
      router.push('/dashboard/tokens')
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to select app',
        description: e?.message || 'Something went wrong while selecting your app.',
      })
    }
  }

  // Filter and paginate tokens
  const filteredTokens = useMemo(() => {
    let filtered = tokens

    if (searchQuery) {
      filtered = filtered.filter(
        (token) =>
          token.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (token.assigned && token.assigned.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    return filtered
  }, [tokens, searchQuery])

  const paginatedTokens = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredTokens.slice(start, end)
  }, [filteredTokens, currentPage, pageSize])

  const totalPages = Math.ceil(filteredTokens.length / pageSize)

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
              Tokens
            </h1>
            <p className="text-xs text-black/60 dark:text-white/60">
              Given to users to manage blacklists.{' '}
              <a
                href="https://keyauthdocs.apidog.io/dashboard/app/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Learn More
              </a>
            </p>
          </div>

          {/* Tokens Table */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 border border-black/5 dark:border-white/5">
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
                  placeholder="Search tokens..."
                  className="w-48"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      App
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Token
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Assigned
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Banned
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Hash
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Type
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {paginatedTokens.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-black/60 dark:text-white/60">
                        {searchQuery ? 'No tokens found matching your search.' : 'No tokens found. Create your first token to get started.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedTokens.map((token) => (
                      <tr
                        key={token.id}
                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {currentApp?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-black dark:text-white">
                          {token.token}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-black/70 dark:text-white/70">
                          {token.assigned || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {token.banned ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                              Banned
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              Unbanned
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {token.banReason || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {token.hash || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {token.type || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-black/70 dark:text-white/70">
                          {token.status || ''}
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
                  Showing {filteredTokens.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, filteredTokens.length)} of{' '}
                  {filteredTokens.length} records
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
    </>
  )
}

