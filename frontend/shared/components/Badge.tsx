import React from 'react'
import { cn } from '../utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'gradient'
  size?: 'sm' | 'md'
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
}) => {
  const variantStyles = {
    default: 'bg-surface-raised text-text-muted border border-border',
    primary: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border border-secondary/20',
    success: 'bg-success/10 text-success border border-success/20',
    gradient: 'bg-gradient-to-r from-primary/10 to-secondary/10 text-text border border-transparent',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        variantStyles[variant],
        sizeStyles[size]
      )}
    >
      {children}
    </span>
  )
}