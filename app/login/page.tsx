import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative z-10">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 sm:p-10 shadow-2xl animate-slide-up">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-3 text-center tracking-tight">
              Sign In
            </h1>
            <p className="text-sm sm:text-base text-black/60 dark:text-white/60 text-center leading-relaxed">
              Welcome back! Please sign in to your account.
            </p>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <LoginForm />
          </div>
          <p className="mt-8 text-center text-sm text-black/60 dark:text-white/60 leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-black dark:text-white hover:text-black/70 dark:hover:text-white/70 hover:underline transition-all duration-200 hover-lift inline-block"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

