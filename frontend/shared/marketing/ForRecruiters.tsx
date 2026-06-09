import React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { slideInLeft, slideInRight, fadeUp } from '../motion/variants'
import { useReveal } from '../motion/hooks'

const features = [
  { title: 'AI-Powered Screening', description: 'Rank candidates by culture and skills fit instantly.' },
  { title: 'Candidate Ranking', description: 'Our AI scores every applicant so you focus on the best.' },
  { title: 'Automated Scheduling', description: 'Let AI handle interview logistics and reminders.' },
  { title: 'Salary Benchmarking', description: 'Real-time market data to price offers competitively.' },
  { title: 'Team Collaboration', description: 'Share notes, scores, and feedback in one place.' },
]

const barHeights = [85, 62, 94, 70, 78]
const candidates = [
  { initials: 'SC', name: 'Sarah Chen', role: 'Backend Engineer', score: 94, status: 'Top Match' },
  { initials: 'JR', name: 'James Ross', role: 'Full Stack', score: 87, status: 'Strong Fit' },
  { initials: 'AL', name: 'Aisha Lee', role: 'Platform Engineer', score: 82, status: 'Good Fit' },
]

export const ForRecruiters: React.FC = () => {
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
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              For Recruiters
            </span>
          </h2>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left: Dashboard Mock */}
          <motion.div
            className="flex-1 w-full"
            variants={slideInLeft}
            initial="hidden"
            animate={isVisible ? 'visible' : 'hidden'}
          >
            <Card variant="gradient-border" padding="lg">
              {/* Dashboard Header */}
              <div className="text-sm font-heading font-semibold text-text mb-6">
                Recruiter Dashboard
              </div>

              {/* Stats Row */}
              <div className="flex gap-3 mb-6">
                {[
                  { label: 'Open Positions', value: '12' },
                  { label: 'Pipeline', value: '48' },
                  { label: 'Offers', value: '5' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex-1 bg-surface-raised rounded-lg p-3 text-center">
                    <div className="text-xl font-display font-bold text-primary">{value}</div>
                    <div className="text-xs text-text-muted">{label}</div>
                  </div>
                ))}
              </div>

              {/* Bar Chart */}
              <div className="flex items-end gap-2 mb-6 h-24">
                {barHeights.map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm bg-gradient-to-t from-primary to-secondary"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-text-subdued">#{i + 1}</span>
                  </div>
                ))}
              </div>

              {/* Candidate Ranking Table */}
              <div className="space-y-2">
                {candidates.map(({ initials, name, role, score, status }) => (
                  <div
                    key={name}
                    className="flex items-center justify-between bg-surface-raised rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text">{name}</p>
                        <p className="text-xs text-text-muted">{role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">{score}%</span>
                      <Badge variant="success" size="sm">{status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Right: Feature List */}
          <motion.div
            className="flex-1 w-full"
            variants={slideInRight}
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
        </div>
      </div>
    </section>
  )
}