'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

interface ChatChannel {
  id: string
  name: string
  messageDelay: number
  delayUnit: string
  createdAt: Date
}

interface ChatMessage {
  id: string
  author: string
  message: string
  timeSent: Date
  channel: string
  createdAt: Date
}

interface ChatsContentProps {
  user: {
    name?: string | null
    email: string
  }
  apps: { id: string; name: string }[]
  chatChannels: ChatChannel[]
  messages: ChatMessage[]
  currentAppId: string | null
}

export const ChatsContent: React.FC<ChatsContentProps> = ({
  user,
  apps,
  chatChannels: initialChannels,
  messages: initialMessages,
  currentAppId,
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const [chatChannels, setChatChannels] = useState<ChatChannel[]>(initialChannels)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(currentAppId || apps[0]?.id || null)
  const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null)
  const actionDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Table states
  const [channelsSearchQuery, setChannelsSearchQuery] = useState('')
  const [channelsPageSize, setChannelsPageSize] = useState(10)
  const [channelsCurrentPage, setChannelsCurrentPage] = useState(1)
  const [messagesSearchQuery, setMessagesSearchQuery] = useState('')
  const [messagesPageSize, setMessagesPageSize] = useState(10)
  const [messagesCurrentPage, setMessagesCurrentPage] = useState(1)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [showUnmuteModal, setShowUnmuteModal] = useState(false)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [showMuteModal, setShowMuteModal] = useState(false)
  const [userToMute, setUserToMute] = useState<string | null>(null)

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    unit: '1',
    delay: '',
  })

  const [muteForm, setMuteForm] = useState({
    unit: '1',
    time: '',
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
      router.push('/dashboard/chats')
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to select app',
        description: e?.message || 'Something went wrong while selecting your app.',
      })
    }
  }

  const handleCreateChannel = async () => {
    if (!selectedAppId || !createForm.name || !createForm.delay) {
      toast({
        variant: 'error',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      })
      return
    }

    try {
      const res = await fetch('/api/chats/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          name: createForm.name,
          unit: Number(createForm.unit),
          delay: Number(createForm.delay),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create chat channel')

      toast({
        variant: 'success',
        title: 'Chat channel created',
        description: 'The chat channel has been created successfully.',
      })

      setShowCreateModal(false)
      setCreateForm({ name: '', unit: '1', delay: '' })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to create channel',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleClearChannel = async (channelName: string) => {
    if (!selectedAppId) return

    try {
      const res = await fetch('/api/chats/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          channelName,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to clear channel')

      toast({
        variant: 'success',
        title: 'Channel cleared',
        description: 'All messages in the channel have been deleted.',
      })

      setShowClearModal(false)
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to clear channel',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleDeleteAllChannels = async () => {
    if (!selectedAppId) return

    try {
      const res = await fetch('/api/chats/channels', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to delete channels')

      toast({
        variant: 'success',
        title: 'Channels deleted',
        description: 'All chat channels have been deleted.',
      })

      setShowDeleteAllModal(false)
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to delete channels',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleMuteUser = async () => {
    if (!selectedAppId || !userToMute || !muteForm.time) {
      toast({
        variant: 'error',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      })
      return
    }

    try {
      const res = await fetch('/api/chats/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          username: userToMute,
          unit: Number(muteForm.unit),
          time: Number(muteForm.time),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to mute user')

      toast({
        variant: 'success',
        title: 'User muted',
        description: 'The user has been muted successfully.',
      })

      setShowMuteModal(false)
      setUserToMute(null)
      setMuteForm({ unit: '1', time: '' })
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to mute user',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleUnmuteUser = async (username: string) => {
    if (!selectedAppId) return

    try {
      const res = await fetch('/api/chats/unmute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          username,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to unmute user')

      toast({
        variant: 'success',
        title: 'User unmuted',
        description: 'The user has been unmuted successfully.',
      })

      setShowUnmuteModal(false)
      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to unmute user',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleDeleteChannel = async (channelName: string) => {
    if (!selectedAppId) return

    try {
      const res = await fetch('/api/chats/channels', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          channelName,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to delete channel')

      toast({
        variant: 'success',
        title: 'Channel deleted',
        description: 'The channel has been deleted successfully.',
      })

      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to delete channel',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedAppId) return

    try {
      const res = await fetch('/api/chats/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: selectedAppId,
          messageId,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to delete message')

      toast({
        variant: 'success',
        title: 'Message deleted',
        description: 'The message has been deleted successfully.',
      })

      router.refresh()
    } catch (e: any) {
      toast({
        variant: 'error',
        title: 'Failed to delete message',
        description: e?.message || 'Something went wrong.',
      })
    }
  }

  const formatDelay = (delay: number, unit: string) => {
    const totalSeconds = delay * Number(unit)
    if (totalSeconds >= 315569260) return 'Lifetime'
    if (totalSeconds >= 31556926) return `${Math.floor(totalSeconds / 31556926)} year(s)`
    if (totalSeconds >= 2629743) return `${Math.floor(totalSeconds / 2629743)} month(s)`
    if (totalSeconds >= 604800) return `${Math.floor(totalSeconds / 604800)} week(s)`
    if (totalSeconds >= 86400) return `${Math.floor(totalSeconds / 86400)} day(s)`
    if (totalSeconds >= 3600) return `${Math.floor(totalSeconds / 3600)} hour(s)`
    if (totalSeconds >= 60) return `${Math.floor(totalSeconds / 60)} minute(s)`
    return `${totalSeconds} second(s)`
  }

  // Filter and paginate channels
  const filteredChannels = useMemo(() => {
    let filtered = chatChannels
    if (channelsSearchQuery) {
      filtered = filtered.filter((channel) =>
        channel.name.toLowerCase().includes(channelsSearchQuery.toLowerCase())
      )
    }
    return filtered
  }, [chatChannels, channelsSearchQuery])

  const paginatedChannels = useMemo(() => {
    const start = (channelsCurrentPage - 1) * channelsPageSize
    const end = start + channelsPageSize
    return filteredChannels.slice(start, end)
  }, [filteredChannels, channelsCurrentPage, channelsPageSize])

  const channelsTotalPages = Math.ceil(filteredChannels.length / channelsPageSize)

  // Filter and paginate messages
  const filteredMessages = useMemo(() => {
    let filtered = messages
    if (messagesSearchQuery) {
      filtered = filtered.filter(
        (msg) =>
          msg.author.toLowerCase().includes(messagesSearchQuery.toLowerCase()) ||
          msg.message.toLowerCase().includes(messagesSearchQuery.toLowerCase()) ||
          msg.channel.toLowerCase().includes(messagesSearchQuery.toLowerCase())
      )
    }
    return filtered
  }, [messages, messagesSearchQuery])

  const paginatedMessages = useMemo(() => {
    const start = (messagesCurrentPage - 1) * messagesPageSize
    const end = start + messagesPageSize
    return filteredMessages.slice(start, end)
  }, [filteredMessages, messagesCurrentPage, messagesPageSize])

  const messagesTotalPages = Math.ceil(filteredMessages.length / messagesPageSize)

  // Handle click outside for action dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(actionDropdownRefs.current).forEach(([id, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          if (openActionDropdown === id) {
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
              Chats
            </h1>
            <p className="text-xs text-black/60 dark:text-white/60">
              Allow your users to chat with each other.{' '}
              <a
                href="https://keyauthdocs.apidog.io/dashboard/app/chats"
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
                Create Chat Channel
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowUnmuteModal(true)}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                Unmute User
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowClearModal(true)}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Chat Channel
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteAllModal(true)}
                className="flex items-center gap-2 !bg-red-500/10 hover:!bg-red-500/20 !text-red-600 dark:!text-red-400 !border-red-500/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete All Chat Channels
              </Button>
            </div>

            {/* Chat Channels Table */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Chat Channels</h2>
              
              {/* Search and Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-black/70 dark:text-white/70">Show</label>
                  <Select
                    value={String(channelsPageSize)}
                    onChange={(value) => {
                      setChannelsPageSize(Number(value))
                      setChannelsCurrentPage(1)
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
                    value={channelsSearchQuery}
                    onChange={(e) => {
                      setChannelsSearchQuery(e.target.value)
                      setChannelsCurrentPage(1)
                    }}
                    placeholder="Search channels..."
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
                        Chat Name
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                        Message Delay
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {paginatedChannels.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-black/60 dark:text-white/60">
                          {channelsSearchQuery ? 'No channels found matching your search.' : 'No data available in table'}
                        </td>
                      </tr>
                    ) : (
                      paginatedChannels.map((channel) => (
                        <tr
                          key={channel.id}
                          className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3 text-black/70 dark:text-white/70">{channel.name}</td>
                          <td className="px-4 py-3 text-black/70 dark:text-white/70">{formatDelay(channel.messageDelay, channel.delayUnit)}</td>
                          <td className="px-4 py-3">
                            <div className="relative" ref={(el: HTMLDivElement | null) => { actionDropdownRefs.current[`channel-${channel.id}`] = el; }}>
                              <button
                                onClick={() =>
                                  setOpenActionDropdown(
                                    openActionDropdown === `channel-${channel.id}` ? null : `channel-${channel.id}`
                                  )
                                }
                                className="flex items-center gap-1.5 glass-input border border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 text-black dark:text-white font-semibold py-2 px-4 text-sm transition-all duration-200 hover:bg-white/80 dark:hover:bg-white/10 hover:border-black/30 dark:hover:border-white/30"
                                type="button"
                              >
                                <span>Actions</span>
                                <svg
                                  className={`fill-current h-4 w-4 transition-transform duration-200 ${
                                    openActionDropdown === `channel-${channel.id}` ? 'rotate-180' : ''
                                  }`}
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  style={{ marginTop: '3px' }}
                                >
                                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                                </svg>
                              </button>
                              {openActionDropdown === `channel-${channel.id}` && (
                                <div className="absolute z-50 right-0 mt-2 glass-card border border-black/20 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden animate-scale-in min-w-[180px]">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        handleClearChannel(channel.name)
                                        setOpenActionDropdown(null)
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                      type="button"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Clear Channel
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDeleteChannel(channel.name)
                                        setOpenActionDropdown(null)
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                      type="button"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete Channel
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
              {channelsTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-black/60 dark:text-white/60">
                    Showing {filteredChannels.length === 0 ? 0 : (channelsCurrentPage - 1) * channelsPageSize + 1} to{' '}
                    {Math.min(channelsCurrentPage * channelsPageSize, filteredChannels.length)} of {filteredChannels.length} records
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChannelsCurrentPage(Math.max(1, channelsCurrentPage - 1))}
                      disabled={channelsCurrentPage === 1}
                      className="px-3 py-2 glass-input border border-black/20 dark:border-white/20 rounded-lg text-sm font-medium text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                      type="button"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, channelsTotalPages) }, (_, i) => {
                      let pageNum
                      if (channelsTotalPages <= 5) {
                        pageNum = i + 1
                      } else if (channelsCurrentPage <= 3) {
                        pageNum = i + 1
                      } else if (channelsCurrentPage >= channelsTotalPages - 2) {
                        pageNum = channelsTotalPages - 4 + i
                      } else {
                        pageNum = channelsCurrentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setChannelsCurrentPage(pageNum)}
                          className={`px-3 py-2 glass-input border rounded-lg text-sm font-medium transition-colors ${
                            channelsCurrentPage === pageNum
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
                      onClick={() => setChannelsCurrentPage(Math.min(channelsTotalPages, channelsCurrentPage + 1))}
                      disabled={channelsCurrentPage === channelsTotalPages}
                      className="px-3 py-2 glass-input border border-black/20 dark:border-white/20 rounded-lg text-sm font-medium text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                      type="button"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Messages Table */}
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Messages</h2>
              
              {/* Search and Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-black/70 dark:text-white/70">Show</label>
                  <Select
                    value={String(messagesPageSize)}
                    onChange={(value) => {
                      setMessagesPageSize(Number(value))
                      setMessagesCurrentPage(1)
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
                    value={messagesSearchQuery}
                    onChange={(e) => {
                      setMessagesSearchQuery(e.target.value)
                      setMessagesCurrentPage(1)
                    }}
                    placeholder="Search messages..."
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
                        Author
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                        Message
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                        Time Sent
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                        Channel
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 dark:text-white/70">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {paginatedMessages.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-black/60 dark:text-white/60">
                          {messagesSearchQuery ? 'No messages found matching your search.' : 'No data available in table'}
                        </td>
                      </tr>
                    ) : (
                      paginatedMessages.map((message) => (
                        <tr
                          key={message.id}
                          className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3 text-black/70 dark:text-white/70">{message.author}</td>
                          <td className="px-4 py-3 text-black/70 dark:text-white/70 max-w-md truncate">{message.message}</td>
                          <td className="px-4 py-3 text-black/70 dark:text-white/70">{new Date(message.timeSent).toLocaleString()}</td>
                          <td className="px-4 py-3 text-black/70 dark:text-white/70">{message.channel}</td>
                          <td className="px-4 py-3">
                            <div className="relative" ref={(el: HTMLDivElement | null) => { actionDropdownRefs.current[`message-${message.id}`] = el; }}>
                              <button
                                onClick={() =>
                                  setOpenActionDropdown(
                                    openActionDropdown === `message-${message.id}` ? null : `message-${message.id}`
                                  )
                                }
                                className="flex items-center gap-1.5 glass-input border border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 text-black dark:text-white font-semibold py-2 px-4 text-sm transition-all duration-200 hover:bg-white/80 dark:hover:bg-white/10 hover:border-black/30 dark:hover:border-white/30"
                                type="button"
                              >
                                <span>Actions</span>
                                <svg
                                  className={`fill-current h-4 w-4 transition-transform duration-200 ${
                                    openActionDropdown === `message-${message.id}` ? 'rotate-180' : ''
                                  }`}
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  style={{ marginTop: '3px' }}
                                >
                                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"></path>
                                </svg>
                              </button>
                              {openActionDropdown === `message-${message.id}` && (
                                <div className="absolute z-50 right-0 mt-2 glass-card border border-black/20 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden animate-scale-in min-w-[180px]">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setUserToMute(message.author)
                                        setShowMuteModal(true)
                                        setOpenActionDropdown(null)
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                                      type="button"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                      </svg>
                                      Mute User
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDeleteMessage(message.id)
                                        setOpenActionDropdown(null)
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                      type="button"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete Message
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
              {messagesTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-black/60 dark:text-white/60">
                    Showing {filteredMessages.length === 0 ? 0 : (messagesCurrentPage - 1) * messagesPageSize + 1} to{' '}
                    {Math.min(messagesCurrentPage * messagesPageSize, filteredMessages.length)} of {filteredMessages.length} records
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMessagesCurrentPage(Math.max(1, messagesCurrentPage - 1))}
                      disabled={messagesCurrentPage === 1}
                      className="px-3 py-2 glass-input border border-black/20 dark:border-white/20 rounded-lg text-sm font-medium text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                      type="button"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, messagesTotalPages) }, (_, i) => {
                      let pageNum
                      if (messagesTotalPages <= 5) {
                        pageNum = i + 1
                      } else if (messagesCurrentPage <= 3) {
                        pageNum = i + 1
                      } else if (messagesCurrentPage >= messagesTotalPages - 2) {
                        pageNum = messagesTotalPages - 4 + i
                      } else {
                        pageNum = messagesCurrentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setMessagesCurrentPage(pageNum)}
                          className={`px-3 py-2 glass-input border rounded-lg text-sm font-medium transition-colors ${
                            messagesCurrentPage === pageNum
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
                      onClick={() => setMessagesCurrentPage(Math.min(messagesTotalPages, messagesCurrentPage + 1))}
                      disabled={messagesCurrentPage === messagesTotalPages}
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
      </div>

      {/* Create Chat Channel Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setCreateForm({ name: '', unit: '1', delay: '' })
        }}
        title="Create Chat Channel"
      >
        <div className="space-y-4">
          <Input
            label="Chat Channel Name"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="Enter channel name"
          />
          <Select
            label="Chat Cooldown Unit"
            value={createForm.unit}
            onChange={(value) => setCreateForm({ ...createForm, unit: value })}
            options={[
              { value: '1', label: 'Seconds' },
              { value: '60', label: 'Minutes' },
              { value: '3600', label: 'Hours' },
              { value: '86400', label: 'Days' },
              { value: '604800', label: 'Weeks' },
              { value: '2629743', label: 'Months' },
              { value: '31556926', label: 'Years' },
              { value: '315569260', label: 'Lifetime' },
            ]}
          />
          <Input
            label="Cooldown Time * By Unit"
            type="number"
            value={createForm.delay}
            onChange={(e) => setCreateForm({ ...createForm, delay: e.target.value })}
            placeholder="Enter cooldown time"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false)
                setCreateForm({ name: '', unit: '1', delay: '' })
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateChannel}>
              Create Chat Channel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clear Chat Channel Modal */}
      <Modal
        open={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Chat Channel"
      >
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-amber-600/10 dark:from-amber-900/30 dark:to-amber-800/30 text-amber-700 dark:text-amber-400 text-sm p-4">
            <p className="font-semibold mb-1">Notice!</p>
            <p className="text-xs opacity-90">
              You&apos;re about to clear a chat channel. This will delete all messages in this channel. This can not be undone!
            </p>
          </div>
          <Select
            label="Select Channel"
            value=""
            onChange={(value) => {
              if (value) {
                handleClearChannel(value)
              }
            }}
            options={chatChannels.map((channel) => ({ value: channel.name, label: channel.name }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowClearModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unmute User Modal */}
      <Modal
        open={showUnmuteModal}
        onClose={() => setShowUnmuteModal(false)}
        title="Unmute User"
      >
        <div className="space-y-4">
          <p className="text-sm text-black/70 dark:text-white/70">
            Are you sure you want to unmute this user?
          </p>
          <Select
            label="Select User To Unmute"
            value=""
            onChange={(value) => {
              if (value) {
                handleUnmuteUser(value)
              }
            }}
            options={[
              // TODO: Fetch muted users from API
              { value: 'user1', label: 'User 1' },
              { value: 'user2', label: 'User 2' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowUnmuteModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete All Chat Channels Modal */}
      <DeleteModal
        open={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={handleDeleteAllChannels}
        loading={false}
        title="Delete All Chat Channels"
        message="Are you sure you want to delete all of your chat channels? This cannot be undone."
      />

      {/* Mute User Modal */}
      <Modal
        open={showMuteModal && !!userToMute}
        onClose={() => {
          setShowMuteModal(false)
          setUserToMute(null)
          setMuteForm({ unit: '1', time: '' })
        }}
        title="Mute User"
      >
        <div className="space-y-4">
          <Input
            label="User"
            value={userToMute || ''}
            readOnly
          />
          <Select
            label="Mute Unit"
            value={muteForm.unit}
            onChange={(value) => setMuteForm({ ...muteForm, unit: value })}
            options={[
              { value: '1', label: 'Seconds' },
              { value: '60', label: 'Minutes' },
              { value: '3600', label: 'Hours' },
              { value: '86400', label: 'Days' },
              { value: '604800', label: 'Weeks' },
              { value: '2629743', label: 'Months' },
              { value: '31556926', label: 'Years' },
              { value: '315569260', label: 'Lifetime' },
            ]}
          />
          <Input
            label="Mute Duration"
            type="number"
            value={muteForm.time}
            onChange={(e) => setMuteForm({ ...muteForm, time: e.target.value })}
            placeholder="Enter duration"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowMuteModal(false)
                setUserToMute(null)
                setMuteForm({ unit: '1', time: '' })
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleMuteUser}>
              Mute User
            </Button>
          </div>
        </div>
      </Modal>
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

