import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../components/Button'
import { fadeUp } from '../motion/variants'
import { useReveal, useReducedMotion } from '../motion/hooks'

interface Message {
  id: number
  role: 'user' | 'ai' | 'thinking'
  text?: string
}

const initialMessages: Message[] = [
  { id: 0, role: 'user', text: 'Find backend jobs in Bangalore.' },
  { id: 1, role: 'ai', text: 'Searching through 12,400 open positions...' },
  { id: 2, role: 'ai', text: 'Found 37 matches. Negotiating salary range with 8 companies...' },
  { id: 3, role: 'ai', text: 'Preparing interview strategy. Top match: Senior Backend at Stripe (94% fit).' },
]

export const AIChatDemo: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState(0)
  const [started, setStarted] = useState(false)
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useReveal(0.3)

  useEffect(() => {
    if (!isVisible || reducedMotion) {
      if (isVisible && reducedMotion) setVisibleCount(initialMessages.length)
      return
    }
    if (!started) {
      setStarted(true)
      const timers: ReturnType<typeof setTimeout>[] = []
      initialMessages.forEach((_, i) => {
        timers.push(setTimeout(() => setVisibleCount(i + 1), i * 1500))
      })
      return () => timers.forEach(clearTimeout)
    }
  }, [isVisible, started, reducedMotion])

  // Show all at once for reduced motion users
  useEffect(() => {
    if (reducedMotion && isVisible) {
      setVisibleCount(initialMessages.length)
    }
  }, [reducedMotion, isVisible])

  const visibleMessages = initialMessages.slice(0, visibleCount)

  return (
    <section id="demo" className="py-24 md:py-32 bg-surface">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Title */}
        <motion.div
          ref={ref}
          className="text-center mb-12"
          variants={fadeUp}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          <h2 className="text-4xl md:text-5xl font-display font-semibold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Meet Your AI Agent
            </span>
          </h2>
        </motion.div>

        {/* Chat Interface */}
        <motion.div
          className="max-w-2xl mx-auto"
          variants={fadeUp}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-glow">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-error" />
                <div className="w-3 h-3 rounded-full bg-warning" />
                <div className="w-3 h-3 rounded-full bg-success" />
              </div>
              <span className="text-xs text-text-subdued font-caption">directhire.ai/agent</span>
            </div>

            {/* Messages */}
            <div className="p-6 flex flex-col gap-4 min-h-[280px]">
              <AnimatePresence mode="sync">
                {visibleMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    className={msg.role === 'user'
                      ? 'ml-auto max-w-[75%]'
                      : 'mr-auto max-w-[80%]'
                    }
                  >
                    {msg.role === 'thinking' ? (
                      <div className="bg-surface-raised rounded-xl px-4 py-3 flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-2 h-2 rounded-full bg-primary"
                            animate={reducedMotion ? {} : { y: [0, -6, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: i * 0.1,
                              ease: 'easeInOut',
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`rounded-xl px-4 py-3 text-sm ${
                          msg.role === 'user'
                            ? 'bg-primary/10 text-text'
                            : 'bg-surface-raised text-text'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Thinking indicator between user and first AI message */}
              {visibleCount === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mr-auto max-w-[80%]"
                >
                  <div className="bg-surface-raised rounded-xl px-4 py-3 flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={reducedMotion ? {} : { y: [0, -6, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Bar */}
            <div className="px-6 py-4 border-t border-border flex gap-3">
              <input
                type="text"
                disabled
                placeholder="Ask your Career Agent..."
                className="flex-1 bg-surface-raised border border-border rounded-lg px-4 py-2.5 text-sm text-text-muted placeholder:text-text-subdued focus:outline-none"
              />
              <Button size="md" onClick={() => {}}>
                Send
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}