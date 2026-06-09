import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../utils/cn'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  minRows?: number
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', minRows = 4, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#8b92b4] mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={minRows}
          className={cn(
            'w-full rounded-xl border bg-[#0c1324] px-4 py-3 text-[#dce1fb] placeholder-[#5a6078] transition-colors focus:outline-none resize-none',
            error
              ? 'border-[#ff6b6b] focus:border-[#ff6b6b] focus:ring-2 focus:ring-[#ff6b6b]/30'
              : 'border-[#2a3150] focus:border-[#adc6ff]/50 focus:ring-2 focus:ring-[#adc6ff]/30',
            className
          )}
          {...props}
        />
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key={error}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-1.5 text-sm text-[#ff6b6b]"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'