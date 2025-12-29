'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

export const LogoutButton: React.FC = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout} isLoading={isLoading}>
      Logout
    </Button>
  )
}

