import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '../utils/cn'

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'primary' | 'outline' | 'ghost' | 'gradient-border' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background overflow-hidden'

  const variantStyles = {
    primary: 'bg-gradient-to-r from-primary-dark to-primary text-white shadow-glow hover:shadow-glow-strong focus:ring-primary border-none',
    outline: 'bg-surface border border-border text-text hover:border-primary/50 hover:bg-surface-raised focus:ring-primary',
    ghost: 'bg-transparent text-text-muted hover:text-primary hover:bg-primary/5 focus:ring-primary',
    'gradient-border': '',
    danger: 'bg-gradient-to-r from-error/90 to-error text-white hover:shadow-lg focus:ring-error border-none',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
    xl: 'px-10 py-4 text-xl',
  }

  if (variant === 'gradient-border') {
    return (
      <motion.button
        className={cn(
          'relative rounded-lg p-[1px] bg-gradient-to-r from-primary to-secondary',
          'hover:from-primary-light hover:to-secondary-light transition-all duration-200',
          className
        )}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        {...props}
      >
        <div className={cn(
          'relative flex items-center justify-center rounded-[calc(var(--radius-lg)-1px)] bg-surface',
          'text-text font-medium',
          sizeStyles[size],
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}>
          {loading ? (
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : null}
          <span className="relative z-10 flex items-center gap-2">{children}</span>
        </div>
      </motion.button>
    )
  }

  return (
    <motion.button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      {...props}
    >
      {loading ? (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  )
}