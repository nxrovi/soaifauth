import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative z-10">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 sm:p-10 shadow-2xl animate-slide-up">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-3 text-center tracking-tight">
              Forgot Password
            </h1>
            <p className="text-sm sm:text-base text-black/60 dark:text-white/60 text-center leading-relaxed">
              No worries! Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <ForgotPasswordForm />
          </div>
          <p className="mt-8 text-center text-sm text-black/60 dark:text-white/60 leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-semibold text-black dark:text-white hover:text-black/70 dark:hover:text-white/70 hover:underline transition-all duration-200 hover-lift inline-block"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

