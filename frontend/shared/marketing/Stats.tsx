import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '../motion/variants'
import { useReveal } from '../motion/hooks'

interface Stat {
  value: number
  suffix: string
  label: string
}

const stats: Stat[] = [
  { value: 250, suffix: 'K+', label: 'Candidates' },
  { value: 12, suffix: 'K+', label: 'Recruiters' },
  { value: 92, suffix: '%', label: 'Hiring Success' },
  { value: 35, suffix: '%', label: 'Salary Uplift' },
]

function useCountUp(target: number, isActive: boolean, duration = 2000): number {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isActive) return

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isActive, target, duration])

  return count
}

function StatCard({ value, suffix, label }: Stat) {
  const { ref, isVisible } = useReveal(0.3)
  const count = useCountUp(value, isVisible)

  return (
    <motion.div
      ref={ref}
      className="text-center"
      variants={fadeUp}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
    >
      <div className="text-5xl md:text-6xl font-display font-bold mb-2">
        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {count}
        </span>
        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {suffix}
        </span>
      </div>
      <p className="text-sm text-text-muted">{label}</p>
    </motion.div>
  )
}

export const Stats: React.FC = () => {
  const { ref, isVisible } = useReveal(0.2)

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-background to-surface">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          ref={ref}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}