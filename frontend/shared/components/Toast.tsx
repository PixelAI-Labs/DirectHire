import React, { useState, useCallback, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { cn } from '../utils/cn'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toastConfig = {
  success: {
    icon: CheckCircle,
    className: 'border-[#6bffa6]/30 bg-[#151b2d]/90 text-[#6bffa6]',
  },
  error: {
    icon: XCircle,
    className: 'border-[#ff6b6b]/30 bg-[#151b2d]/90 text-[#ff6b6b]',
  },
  info: {
    icon: Info,
    className: 'border-[#adc6ff]/30 bg-[#151b2d]/90 text-[#adc6ff]',
  },
}

interface ToastProps {
  toast: ToastItem
  onRemove: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const config = toastConfig[toast.type]
  const Icon = config.icon

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 5000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm max-w-sm',
        config.className
      )}
      role="alert"
    >
      <Icon size={18} className="shrink-0" />
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity ml-1"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
    setToasts((prev) => {
      const next = [...prev, { id, message, type }]
      return next.slice(-5)
    })
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 p-4 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}