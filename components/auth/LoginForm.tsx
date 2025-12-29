'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

export const LoginForm: React.FC = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await cred.user.getIdToken(true) // force refresh to avoid stale/invalid tokens

      const response = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        return
      }

      router.push('/apps')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setIsGoogleLoading(true)

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken(true) // force refresh to avoid stale/invalid tokens

      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Google sign-in failed')
        return
      }

      router.push('/apps')
      router.refresh()
    } catch (err) {
      setError('Google sign-in failed. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50/90 dark:bg-red-950/40 backdrop-blur-sm border border-red-400/50 dark:border-red-500/50 rounded-xl text-red-700 dark:text-red-400 font-medium text-sm shadow-sm flex items-start gap-2.5 animate-slide-up">
          <span className="text-red-600 dark:text-red-400 mt-0.5 animate-pulse">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="your@email.com"
      />

      <div className="space-y-2">
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
        <div className="flex justify-end">
          <a
            href="/forgot"
            className="text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:underline transition-colors"
          >
            Forgot password?
          </a>
        </div>
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full">
        Sign In
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-black/10 dark:border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-2 bg-transparent text-black/60 dark:text-white/60">or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={handleGoogleLogin}
        isLoading={isGoogleLoading}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className="h-5 w-5"
        >
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.4 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.5 16 18.9 14 24 14c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.4 29.6 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 10.1-2 13.8-5.2l-6.4-5.4C29.3 34.5 26.8 35 24 35c-5.1 0-9.4-3.1-11.2-7.5l-6.5 5C9.2 39.5 16.1 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-1.4 4-5.3 7-10.3 7-5.1 0-9.4-3.1-11.2-7.5l-6.5 5C9.2 39.5 16.1 44 24 44c8.9 0 20-7.2 20-20 0-1.3-.1-2.7-.4-3.5z"
          />
        </svg>
        Continue with Google
      </Button>
    </form>
  )
}

