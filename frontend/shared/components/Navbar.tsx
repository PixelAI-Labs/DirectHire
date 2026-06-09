import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '../utils/cn'

interface NavbarProps {
  variant?: 'candidate' | 'recruiter'
}

const navLinks = {
  candidate: [
    { label: 'Jobs', href: '/jobs' },
    { label: 'Applications', href: '/applications' },
    { label: 'Agent', href: '/agent' },
    { label: 'Profile', href: '/profile' },
  ],
  recruiter: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Jobs', href: '/jobs' },
    { label: 'Candidates', href: '/candidates' },
  ],
}

const navKeyframes = `
@keyframes underline {
  from { width: 0; }
  to { width: 100%; }
}
`

export const Navbar: React.FC<NavbarProps> = ({ variant = 'candidate' }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = navLinks[variant]

  return (
    <>
      <style>{navKeyframes}</style>
      <nav className="sticky top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <a
            href="/"
            className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-bold text-transparent"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            DirectHire
          </a>

          {/* Desktop Links */}
          <div className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative text-sm font-medium text-text-muted transition-colors hover:text-text"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-primary to-secondary transition-all duration-200 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-text md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-border bg-surface p-6 shadow-lg md:hidden"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mt-8 flex flex-col gap-4">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-lg font-medium text-text-muted transition-colors hover:text-text"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}