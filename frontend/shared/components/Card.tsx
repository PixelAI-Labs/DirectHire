import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '../utils/cn'

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  variant?: 'default' | 'gradient-border' | 'shimmer'
  padding?: 'none' | 'default' | 'lg'
  hover?: boolean
}

const shimmerKeyframes = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
`

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'default',
  hover = false,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    default: 'p-6',
    lg: 'p-8',
  }

  if (variant === 'gradient-border') {
    return (
      <>
        <style>{shimmerKeyframes}</style>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
          className={cn(
            'relative rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 p-[1px]',
            className
          )}
          {...props}
        >
          <div className={cn(
            'rounded-[calc(var(--radius-xl)-1px)] bg-surface',
            paddingStyles[padding]
          )}>
            {children}
          </div>
        </motion.div>
      </>
    )
  }

  if (variant === 'shimmer') {
    return (
      <>
        <style>{shimmerKeyframes}</style>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
          className={cn(
            'relative overflow-hidden rounded-xl border border-border bg-surface',
            paddingStyles[padding],
            'hover:border-border-hover',
            'transition-colors duration-200',
            'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent',
            'hover:before:animate-shimmer',
            className
          )}
          {...props}
        >
          {children}
        </motion.div>
      </>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={cn(
        'relative rounded-xl border border-border bg-surface',
        paddingStyles[padding],
        'hover:-translate-y-1 hover:border-border-hover',
        'transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}