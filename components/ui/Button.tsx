import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  isLoading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-[0.98] relative overflow-hidden group'

  const variants = {
    primary:
      'bg-black dark:bg-white text-white dark:text-black hover:bg-black/95 dark:hover:bg-white/90 focus:ring-black/30 dark:focus:ring-white/30 shadow-lg hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-white/20 border border-black/10 dark:border-white/20 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700',
    secondary:
      'glass text-black dark:text-white border border-black/15 dark:border-white/20 hover:bg-white/90 dark:hover:bg-white/10 hover:border-black/25 dark:hover:border-white/30 focus:ring-black/20 dark:focus:ring-white/20 shadow-sm hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-white/10',
    outline:
      'glass-input text-black dark:text-white border border-black/20 dark:border-white/25 hover:bg-white/70 dark:hover:bg-white/10 hover:border-black/35 dark:hover:border-white/35 focus:ring-black/20 dark:focus:ring-white/20 shadow-sm hover:shadow-md',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

