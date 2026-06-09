import React from 'react'
import { motion } from 'framer-motion'
import { UserPlus, Search, DollarSign } from 'lucide-react'
import { Card } from '../components/Card'
import { staggerContainer, fadeUp } from '../motion/variants'
import { useReveal } from '../motion/hooks'

const steps = [
  {
    num: '01',
    Icon: UserPlus,
    title: 'Build Profile',
    description: 'Connect your resume and let our AI analyze your skills, experience, and career goals to create a compelling profile.',
  },
  {
    num: '02',
    Icon: Search,
    title: 'AI Finds Opportunities',
    description: 'Our AIscouts thousands of positions, matches you with the best fits, and auto-applies on your behalf.',
  },
  {
    num: '03',
    Icon: DollarSign,
    title: 'AI Negotiates Offers',
    description: 'Receive competing offers and let your AI agent negotiate the best salary, equity, and benefits package.',
  },
]

export const HowItWorks: React.FC = () => {
  const { ref, isVisible } = useReveal(0.2)

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Title */}
        <motion.div
          ref={ref}
          className="text-center mb-16"
          variants={fadeUp}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          <h2 className="text-4xl md:text-5xl font-display font-semibold mb-4">
            <span className="bg-gradient-to-r from-text via-primary to-text-muted bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <p className="text-lg text-text-muted">
            Three steps to a smarter hire — and career.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          {steps.map(({ num, Icon, title, description }) => (
            <motion.div key={num} variants={fadeUp}>
              <Card variant="gradient-border" padding="lg" hover>
                {/* Gradient Number */}
                <div className="mb-6">
                  <span className="text-6xl font-display font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {num}
                  </span>
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <Icon size={32} className="text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-heading font-semibold text-text mb-3">
                  {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-text-muted leading-relaxed">
                  {description}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}