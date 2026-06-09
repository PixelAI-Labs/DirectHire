import React from 'react'
import { cn } from '../utils'

interface SplitScreenProps {
  children: [React.ReactNode, React.ReactNode]
  className?: string
  leftRatio?: number
}

export function SplitScreen({ children, className, leftRatio = 55 }: SplitScreenProps) {
  const [left, right] = children

  return (
    <div className={cn('flex min-h-screen flex-row', className)}>
      <div
        className="flex items-center justify-center"
        style={{ width: `${leftRatio}%` }}
      >
        {left}
      </div>
      <div className="flex items-center justify-center bg-[#151b2d]" style={{ width: `${100 - leftRatio}%` }}>
        {right}
      </div>
    </div>
  )
}