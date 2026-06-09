import React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { fadeUp, slideInRight, slideInLeft } from '../motion/variants'
import { useReveal } from '../motion/hooks'

const features = [
  {
    title: 'AI Resume Builder',
    description: 'Craft a compelling resume tailored to each role.',
  },
  {
    title: 'Auto Applications',
    description: 'Apply to hundreds of matching jobs with one click.',
  },
  {
    title: 'Interview Coach',
    description: 'Practice with AI-powered mock interviews and feedback.',
  },
  {
    title: 'Salary Negotiator',
    description: 'Never leave money on the table with AI negotiation.',
  },
  {
    title: 'Career Roadmap',
    description: 'Get a personalized growth plan updated in real time.',
  },
]

const jobCards = [
  { company: 'Stripe', role: 'Senior Backend Engineer', score: 94 },
  { company: 'Notion', role: 'Full Stack Developer', score: 88 },
  { company: 'Linear', role: 'Platform Engineer', score: 82 },
]

export const ForCandidates: React.FC = () => {
  const { ref, isVisible } = useReveal(0.2)

  return (
    <section className="py-24 md:py-32 bg-surface">
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
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              For Candidates
            </span>
          </h2>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left: Feature List */}
          <motion.div
            className="flex-1 w-full"
            variants={slideInLeft}
            initial="hidden"
            animate={isVisible ? 'visible' : 'hidden'}
          >
            <div className="space-y-6">
              {features.map(({ title, description }) => (
                <div key={title} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <Check size={12} className="text-success" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-text">{title}</p>
                    <p className="text-sm text-text-muted mt-0.5">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Dashboard Mock */}
          <motion.div
            className="flex-1 w-full"
            variants={slideInRight}
            initial="hidden"
            animate={isVisible ? 'visible' : 'hidden'}
          >
            <Card variant="gradient-border" padding="lg">
              {/* Dashboard Header */}
              <div className="text-sm font-heading font-semibold text-text mb-6">
                Your Career Dashboard
              </div>

              {/* Progress Rows */}
              <div className="space-y-4 mb-6">
                {/* Resume Score */}
                <div>
                  <div className="flex justify-between text-xs text-text-muted mb-1.5">
                    <span>Resume Score</span>
                    <span className="text-success font-semibold">92%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      style={{ width: '92%' }}
                    />
                  </div>
                </div>

                {/* Match Rate */}
                <div>
                  <div className="flex justify-between text-xs text-text-muted mb-1.5">
                    <span>Match Rate</span>
                    <span className="text-primary font-semibold">87%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      style={{ width: '87%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Application Stats */}
              <div className="flex gap-4 mb-6">
                {[
                  { label: 'Active', value: '12', color: 'text-primary' },
                  { label: 'Pending', value: '3', color: 'text-warning' },
                  { label: 'Interviewing', value: '2', color: 'text-success' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex-1 bg-surface-raised rounded-lg p-3 text-center">
                    <div className={`text-xl font-display font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-text-muted">{label}</div>
                  </div>
                ))}
              </div>

              {/* Mini Job Cards */}
              <div className="space-y-3">
                {jobCards.map(({ company, role, score }) => (
                  <div
                    key={company}
                    className="flex items-center justify-between bg-surface-raised rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text">{company}</p>
                      <p className="text-xs text-text-muted">{role}</p>
                    </div>
                    <Badge variant="primary" size="sm">
                      {score}% match
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}