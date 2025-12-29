import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold mb-2.5 text-black/90 dark:text-white/90 tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`glass-input w-full px-4 py-3.5 rounded-xl placeholder-black/35 dark:placeholder-white/40 text-sm sm:text-base font-medium transition-all duration-200 ${className} ${
          error 
            ? 'border-red-400/60 bg-red-50/60 dark:bg-red-950/40 dark:border-red-500/60 focus:border-red-500/70 focus:bg-red-50/80 dark:focus:bg-red-950/50 dark:focus:border-red-500/70' 
            : ''
        }`}
        {...props}
      />
      {error && (
        <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
          <span>•</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

