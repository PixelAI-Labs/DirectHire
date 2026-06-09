import React from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { Card } from '../components/Card'
import { staggerContainer, fadeUp } from '../motion/variants'
import { useReveal } from '../motion/hooks'

interface Testimonial {
  quote: string
  name: string
  role: string
  initials: string
}

const testimonials: Testimonial[] = [
  {
    quote: "DirectHire's AI agent got me 3 offers in 2 weeks. Never looked back.",
    name: 'Sarah Chen',
    role: 'Software Engineer at Stripe',
    initials: 'SC',
  },
  {
    quote: "We cut our time-to-hire by 60%. The AI ranking is scarily accurate.",
    name: 'Mike Ross',
    role: 'VP People at Notion',
    initials: 'MR',
  },
  {
    quote: "My Career Agent negotiates better salaries than I do myself.",
    name: 'James Park',
    role: 'Product Manager at Linear',
    initials: 'JP',
  },
]

function StarRating() {
  return (
    <div className="flex gap-0.5 mb-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={16} className="text-primary fill-primary" />
      ))}
    </div>
  )
}

export const Testimonials: React.FC = () => {
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
          <h2 className="text-4xl md:text-5xl font-display font-semibold">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Loved by professionals
            </span>
          </h2>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          {testimonials.map(({ quote, name, role, initials }) => (
            <motion.div key={name} variants={fadeUp}>
              <Card variant="default" padding="lg" hover>
                <StarRating />

                <blockquote className="italic text-text text-sm leading-relaxed mb-6">
                  &ldquo;{quote}&rdquo;
                </blockquote>

                <div className="border-t border-border pt-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-text text-sm">{name}</p>
                    <p className="text-text-muted text-xs">{role}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}