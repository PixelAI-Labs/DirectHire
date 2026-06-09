import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Play } from 'lucide-react'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { scaleIn, slideInRight, fadeUp } from '../motion/variants'
import { useReducedMotion } from '../motion/hooks'

const auroraKeyframes = `
@keyframes aurora {
  0% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(40px, -40px) rotate(5deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}
`

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
}

export const Hero: React.FC = () => {
  const reducedMotion = useReducedMotion()

  return (
    <>
      <style>{auroraKeyframes}</style>
      <section className="relative min-h-screen flex items-center bg-background overflow-hidden">
        {/* Aurora Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
              filter: 'blur(80px)',
              animation: reducedMotion ? 'none' : 'aurora 20s ease-in-out infinite',
            }}
          />
          <div
            className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 70%)',
              filter: 'blur(80px)',
              animation: reducedMotion ? 'none' : 'aurora 20s ease-in-out infinite 5s',
            }}
          />
          <div
            className="absolute bottom-1/3 left-1/3 w-[450px] h-[450px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
              filter: 'blur(80px)',
              animation: reducedMotion ? 'none' : 'aurora 20s ease-in-out infinite 10s',
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            {/* Left Column */}
            <motion.div
              className="flex-1 w-full lg:w-[55%]"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Badge */}
              <motion.div variants={scaleIn} className="mb-6">
                <Badge variant="gradient">
                  <span
                    className="mr-2 inline-block w-2 h-2 rounded-full bg-success"
                    style={{ animation: reducedMotion ? 'none' : 'pulse-dot 2s ease-in-out infinite' }}
                  />
                  DirectHire v1.0 — AI-Powered Hiring
                </Badge>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                className="text-5xl md:text-7xl lg:text-8xl font-display font-semibold mb-6 leading-[1.1]"
              >
                <span className="bg-gradient-to-r from-text via-primary to-secondary bg-clip-text text-transparent">
                  Your AI Career Agent
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeUp}
                className="text-lg md:text-xl text-text-muted max-w-2xl mb-10"
              >
                DirectHire discovers jobs, optimizes your profile, negotiates offers and manages your
                career growth automatically.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => {}}>
                  <Zap size={18} />
                  Start Your Career Agent
                </Button>
                <Button size="lg" variant="outline" onClick={() => {}}>
                  <Play size={18} />
                  Watch Demo
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Column - AI Assistant Panel */}
            <motion.div
              className="flex-1 w-full lg:w-[45%]"
              variants={slideInRight}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-primary/40 to-secondary/40 shadow-glow">
                <div className="bg-surface rounded-[calc(2rem-2px)] p-6">
                  {/* Panel Header */}
                  <div className="flex items-center gap-2 mb-6">
                    <span className="relative flex h-3 w-3">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"
                        style={{ animationDuration: reducedMotion ? '0s' : '2s' }}
                      />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
                    </span>
                    <span className="font-heading font-semibold text-text">AI Agent Active</span>
                  </div>

                  {/* Panel Rows */}
                  <div className="space-y-4">
                    {/* Resume Score */}
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-text">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Resume Score
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-surface-raised rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: '92%' }} />
                        </div>
                        <Badge variant="success" size="sm">92%</Badge>
                      </div>
                    </div>

                    {/* Matching Jobs */}
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-text">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                        Matching Jobs
                      </div>
                      <Badge variant="primary" size="sm">37 matches found</Badge>
                    </div>

                    {/* Negotiation */}
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-text">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        Negotiation
                      </div>
                      <div className="flex items-center gap-1 text-success">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full bg-success"
                          style={{ animation: reducedMotion ? 'none' : 'pulse-dot 1.5s ease-in-out infinite' }}
                        />
                        <span className="text-sm">In progress</span>
                      </div>
                    </div>

                    {/* Interview Prep */}
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-text">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Interview Prep
                      </div>
                      <span className="text-sm text-text-muted">Scheduled</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}