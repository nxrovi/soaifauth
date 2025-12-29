import React, { useState, useRef, useEffect } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  error?: string
  options?: SelectOption[]
  onChange?: (value: string) => void
  placeholder?: string
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  className = '',
  options = [],
  onChange,
  children,
  value,
  placeholder,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string>('')
  const selectRef = useRef<HTMLDivElement>(null)

  // Get options from children if not provided
  const selectOptions: SelectOption[] = options.length > 0 
    ? options 
    : React.Children.toArray(children)
        .filter((child) => React.isValidElement(child) && child.type === 'option')
        .map((child) => {
          const option = child as React.ReactElement<HTMLOptionElement>
          return {
            value: option.props.value || '',
            label: option.props.children?.toString() || '',
          }
        })

  // Find selected label
  useEffect(() => {
    const selected = selectOptions.find((opt) => opt.value === value)
    setSelectedLabel(selected?.label || '')
  }, [value, selectOptions])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue)
    setIsOpen(false)
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold mb-2.5 text-black/90 dark:text-white/90 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative" ref={selectRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`glass-input w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-between ${
            error
              ? 'border-red-400/60 bg-red-50/60 dark:bg-red-950/40 dark:border-red-500/60 focus:border-red-500/70 focus:bg-red-50/80 dark:focus:bg-red-950/50 dark:focus:border-red-500/70'
              : isOpen
              ? 'bg-white/90 dark:bg-white/15 border-black/30 dark:border-white/40 shadow-lg'
              : 'hover:bg-white/80 dark:hover:bg-white/10 hover:border-black/25 dark:hover:border-white/30'
          } ${className}`}
          disabled={props.disabled}
        >
          <span className={`${!selectedLabel ? 'text-black/35 dark:text-white/40' : 'text-black dark:text-white'}`}>
            {selectedLabel || placeholder || 'Select an option...'}
          </span>
          <svg
            className={`w-5 h-5 text-black/60 dark:text-white/60 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 glass-card border border-black/20 dark:border-white/20 rounded-xl shadow-2xl overflow-hidden animate-scale-in backdrop-blur-xl">
            <div className="max-h-60 overflow-y-auto">
              {selectOptions.map((option, index) => {
                const isSelected = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-all duration-200 flex items-center justify-between group relative ${
                      isSelected
                        ? 'bg-gradient-to-r from-black/10 via-black/5 to-transparent dark:from-white/10 dark:via-white/5 text-black dark:text-white border-l-4 border-black dark:border-white shadow-sm'
                        : 'text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white'
                    } ${index !== selectOptions.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''}`}
                  >
                    <span className="flex items-center gap-3">
                      {isSelected && (
                        <div className="flex-shrink-0 w-5 h-5 rounded-md bg-black dark:bg-white flex items-center justify-center shadow-lg shadow-black/20 dark:shadow-white/20">
                          <svg
                            className="w-3.5 h-3.5 text-white dark:text-black"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                      {!isSelected && (
                        <div className="flex-shrink-0 w-5 h-5 rounded-md border-2 border-black/30 dark:border-white/30 group-hover:border-black/50 dark:group-hover:border-white/50 transition-colors"></div>
                      )}
                      <span className="flex-1">{option.label}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
          <span>•</span>
          <span>{error}</span>
        </p>
      )}
      {/* Hidden native select for form submission */}
      <select
        {...props}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="sr-only"
        aria-hidden="true"
      >
        {children}
      </select>
    </div>
  )
}
