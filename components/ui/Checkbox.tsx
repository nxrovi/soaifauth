import React from 'react'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="w-full">
      <label
        htmlFor={checkboxId}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="relative flex-shrink-0">
          <input
            type="checkbox"
            id={checkboxId}
            className="sr-only"
            {...props}
          />
          <div
            className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
              props.checked
                ? 'border-black dark:border-white bg-black dark:bg-white shadow-lg shadow-black/20 dark:shadow-white/20 scale-110'
                : 'border-black/30 dark:border-white/30 bg-transparent group-hover:border-black/50 dark:group-hover:border-white/50 group-hover:bg-black/5 dark:group-hover:bg-white/5'
            } ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          >
            {props.checked && (
              <svg
                className="w-3.5 h-3.5 text-white dark:text-black"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            )}
          </div>
        </div>
        {label && (
          <span className={`text-sm font-medium transition-colors ${
            props.checked
              ? 'text-black dark:text-white'
              : 'text-black/70 dark:text-white/70 group-hover:text-black dark:group-hover:text-white'
          } ${props.disabled ? 'opacity-50' : ''}`}>
            {label}
          </span>
        )}
      </label>
      {error && (
        <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
          <span>•</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

