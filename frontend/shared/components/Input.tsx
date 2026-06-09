import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  showPasswordToggle?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, showPasswordToggle, className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const effectiveType = isPassword && showPasswordToggle ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <motion.div
            animate={error ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <input
              ref={ref}
              type={effectiveType}
              className={cn(
                'w-full rounded-xl border bg-background px-4 py-2.5 text-text placeholder:text-text-subdued transition-colors focus:outline-none',
                error
                  ? 'border-error/50 focus:border-error/80 focus:ring-2 focus:ring-error/30'
                  : 'border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/30',
                isPassword && showPasswordToggle ? 'pr-10' : '',
                className
              )}
              {...props}
            />
          </motion.div>
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key={error}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-1.5 text-sm text-error"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

Input.displayName = 'Input'