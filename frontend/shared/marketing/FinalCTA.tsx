import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '../components/Button'
import { fadeUp } from '../motion/variants'
import { useReveal, useReducedMotion } from '../motion/hooks'

const glowKeyframes = `
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.15); }
  50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.5), 0 0 60px rgba(139, 92, 246, 0.25); }
}
@keyframes aurora-strong {
  0% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(-50px, -30px) rotate(-5deg); }
  66% { transform: translate(30px, 40px) rotate(3deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
`

export const FinalCTA: React.FC = () => {
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useReveal(0.2)

  return (
    <>
      <style>{glowKeyframes}</style>
      <section className="relative py-32 overflow-hidden">
        {/* Aurora Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)',
              filter: 'blur(100px)',
              animation: reducedMotion ? 'none' : 'aurora-strong 25s ease-in-out infinite',
            }}
          />
          <div
            className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)',
              filter: 'blur(100px)',
              animation: reducedMotion ? 'none' : 'aurora-strong 25s ease-in-out infinite 8s',
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            ref={ref}
            variants={fadeUp}
            initial="hidden"
            animate={isVisible ? 'visible' : 'hidden'}
          >
            <h2 className="text-5xl md:text-7xl font-display font-semibold mb-6">
              <span className="bg-gradient-to-r from-text via-primary to-secondary bg-clip-text text-transparent">
                Let Your AI Handle Your Career.
              </span>
            </h2>

            <p className="text-lg text-text-muted mb-8">
              Join 250,000+ professionals using DirectHire today.
            </p>

            <div className="mb-4">
              <Button
                size="lg"
                onClick={() => {}}
                style={{ animation: reducedMotion ? 'none' : 'glow-pulse 3s ease-in-out infinite' }}
              >
                Get Started Free
                <ArrowRight size={18} />
              </Button>
            </div>

            <p className="text-xs text-text-subdued">No credit card required.</p>
          </motion.div>
        </div>
      </section>
    </>
  )
}