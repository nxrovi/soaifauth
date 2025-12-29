import Link from 'next/link'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative z-10">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 sm:p-10 shadow-2xl animate-slide-up">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-3 text-center tracking-tight">
              Create Account
            </h1>
            <p className="text-sm sm:text-base text-black/60 dark:text-white/60 text-center leading-relaxed">
              Join us! Create your account to get started.
            </p>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <RegisterForm />
          </div>
          <p className="mt-8 text-center text-sm text-black/60 dark:text-white/60 leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            Already have an account?{' '}
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

