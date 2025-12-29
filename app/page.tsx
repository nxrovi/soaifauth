import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative z-10">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="glass rounded-3xl p-10 sm:p-16 shadow-2xl animate-slide-up">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-black dark:text-white mb-6 tracking-tight animate-fade-in">
            <span className="inline-block hover-lift">Venom</span>
            <span className="inline-block hover-lift">Auth</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-black/65 dark:text-white/65 mb-10 leading-relaxed max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            A beautiful black and white transparent authentication system for all languages
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            <Link href="/login" className="w-full sm:w-auto hover-lift">
              <Button className="w-full sm:w-auto min-w-[140px]">Sign In</Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto hover-lift">
              <Button variant="outline" className="w-full sm:w-auto min-w-[140px]">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

