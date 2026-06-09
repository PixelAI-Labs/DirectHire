import React from 'react'
import { cn } from '../utils'

interface FluidContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[90rem]',
}

export function FluidContainer({ children, className, size = 'lg' }: FluidContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-6', sizeClasses[size], className)}>
      {children}
    </div>
  )
}