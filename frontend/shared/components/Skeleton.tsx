import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  circle?: boolean
  rounded?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  circle = false,
  rounded = false,
}) => {
  return (
    <motion.div
      className={cn(
        'bg-[#2a3150]/30',
        circle ? 'rounded-full' : rounded ? 'rounded-lg' : 'rounded-xl',
        className
      )}
      style={{ width, height }}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    />
  )
}

Skeleton.displayName = 'Skeleton'