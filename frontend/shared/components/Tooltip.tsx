import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '../motion'
import { cn } from '../utils/cn'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const positionStyles = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowStyles = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-[#151b2d] border-l-transparent border-r-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#151b2d] border-l-transparent border-r-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-[#151b2d] border-t-transparent border-b-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-[#151b2d] border-t-transparent border-b-transparent border-l-transparent',
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'top' }) => {
  const [visible, setVisible] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            role="tooltip"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 4 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 4 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 pointer-events-none',
              positionStyles[position]
            )}
          >
            <div className="bg-[#151b2d] border border-white/5 rounded-xl px-3 py-2 text-sm text-[#dce1fb] shadow-lg backdrop-blur-sm whitespace-nowrap">
              {content}
            </div>
            <div
              className={cn(
                'absolute w-0 h-0 border-4 border-solid',
                arrowStyles[position]
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

Tooltip.displayName = 'Tooltip'