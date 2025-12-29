'use client'

import type { ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

type Toast = {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  duration: number
}

type ToastInput = Partial<Omit<Toast, 'id'>> & { title: string }

type ToastContextValue = {
  toast: (toast: ToastInput) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantStyles: Record<
  ToastVariant,
  { container: string; icon: string; dot: string; bar: string }
> = {
  success: {
    container:
      'border-emerald-400/35 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-emerald-400/5 text-emerald-50',
    icon: 'text-emerald-200',
    dot: 'bg-emerald-400',
    bar: 'bg-emerald-400',
  },
  error: {
    container:
      'border-rose-400/40 bg-gradient-to-br from-rose-500/20 via-rose-500/10 to-rose-400/5 text-rose-50',
    icon: 'text-rose-200',
    dot: 'bg-rose-400',
    bar: 'bg-rose-400',
  },
  info: {
    container:
      'border-blue-400/35 bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-blue-400/5 text-blue-50',
    icon: 'text-blue-200',
    dot: 'bg-blue-400',
    bar: 'bg-blue-400',
  },
  warning: {
    container:
      'border-amber-400/40 bg-gradient-to-br from-amber-500/25 via-amber-500/10 to-amber-400/5 text-amber-50',
    icon: 'text-amber-200',
    dot: 'bg-amber-400',
    bar: 'bg-amber-400',
  },
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    const timer = timeouts.current.get(id)
    if (timer) {
      clearTimeout(timer)
    }
    timeouts.current.delete(id)
  }, [])

  const addToast = useCallback(
    (input: ToastInput) => {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)

      const toast: Toast = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? 'info',
        duration: input.duration ?? 4200,
      }

      setToasts((prev) => [...prev, toast])

      const timer = setTimeout(() => removeToast(id), toast.duration)
      timeouts.current.set(id, timer)
    },
    [removeToast]
  )

  useEffect(() => {
    return () => {
      timeouts.current.forEach((timer) => clearTimeout(timer))
      timeouts.current.clear()
    }
  }, [])

  const value = useMemo(
    () => ({
      toast: addToast,
      dismiss: removeToast,
    }),
    [addToast, removeToast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

const ToastViewport = ({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: string) => void
}) => {
  return (
    <div className="fixed top-6 right-5 z-[10000] flex flex-col gap-3 w-[360px] max-w-[calc(100vw-24px)]">
      {toasts.map((toast) => {
        const styles = variantStyles[toast.variant]
        return (
          <div
            key={toast.id}
            className={`relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl px-4 py-3.5 animate-slide-up ${styles.container}`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 h-2.5 w-2.5 rounded-full shadow ${styles.dot}`}
                aria-hidden
              />

              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 ${styles.icon}`}
                    >
                      <ToastIcon variant={toast.variant} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold leading-tight text-white">
                        {toast.title}
                      </p>
                      {toast.description && (
                        <p className="text-xs text-white/70 leading-snug">
                          {toast.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDismiss(toast.id)}
                    className="text-white/60 hover:text-white rounded-md p-1 transition-colors"
                    type="button"
                    aria-label="Close notification"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <span
              className={`absolute bottom-0 left-0 h-1 opacity-80 ${styles.bar}`}
              style={{ animation: `toastProgress ${toast.duration}ms linear forwards` }}
            />
          </div>
        )
      })}
    </div>
  )
}

const ToastIcon = ({ variant }: { variant: ToastVariant }) => {
  if (variant === 'success') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
        />
      </svg>
    )
  }

  if (variant === 'error') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  }

  if (variant === 'warning') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a1 1 0 00.86 1.5h18.64a1 1 0 00.86-1.5L13.71 3.86a1 1 0 00-1.72 0z"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}


