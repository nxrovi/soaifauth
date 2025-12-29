'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess(true)
      setEmail('')
    } catch (err: any) {
      // Firebase error handling
      let errorMessage = 'Something went wrong. Please try again.'
      
      if (err.code === 'auth/user-not-found') {
        // Don't reveal if user exists for security
        setSuccess(true)
        setEmail('')
        return
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.'
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-5">
        <div className="p-4 bg-green-50/90 dark:bg-green-950/40 backdrop-blur-sm border border-green-400/50 dark:border-green-500/50 rounded-xl text-green-700 dark:text-green-400 font-medium text-sm shadow-sm flex items-start gap-2.5 animate-slide-up">
          <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
          <div>
            <p className="font-semibold mb-1">Reset link sent!</p>
            <p className="text-xs">
              If an account with that email exists, we&apos;ve sent a password reset link. Please check your inbox.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => {
            setSuccess(false)
            setEmail('')
          }}
        >
          Send Another Email
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50/90 dark:bg-red-950/40 backdrop-blur-sm border border-red-400/50 dark:border-red-500/50 rounded-xl text-red-700 dark:text-red-400 font-medium text-sm shadow-sm flex items-start gap-2.5 animate-slide-up">
          <span className="text-red-600 dark:text-red-400 mt-0.5 animate-pulse">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
        />
        <p className="text-xs text-black/60 dark:text-white/60">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full">
        Send Reset Link
      </Button>
    </form>
  )
}

