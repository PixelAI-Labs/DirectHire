import React from 'react'
import { cn } from '../utils'

interface CenteredSectionProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
}

export function CenteredSection({ children, className, glow = true }: CenteredSectionProps) {
  return (
    <section
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden py-24 text-center',
        className
      )}
    >
      {glow && (
        <>
          <div className="absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#adc6ff]/5 blur-[120px]" />
          <div className="absolute right-1/4 top-1/2 h-[500px] w-[500px] translate-x-1/2 -translate-y-1/2 rounded-full bg-[#adc6ff]/5 blur-[120px]" />
        </>
      )}
      {children}
    </section>
  )
}