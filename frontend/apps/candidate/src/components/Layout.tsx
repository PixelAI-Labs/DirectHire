import React, { useState } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { ToastProvider, useToast } from '@directhire/shared'
import { motion } from 'framer-motion'
import { Menu, X, LogOut, User, Briefcase, FileText, Gift, Bot } from 'lucide-react'

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.addToast('Logged out successfully', 'success')
    navigate('/login')
  }

  const navLinks = [
    { label: 'Jobs', href: '/jobs', icon: Briefcase },
    { label: 'Applications', href: '/applications', icon: FileText },
    { label: 'Offers', href: '/offers', icon: Gift },
    { label: 'Agent', href: '/agent', icon: Bot },
    { label: 'Profile', href: '/profile', icon: User },
  ]

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-[#0c1324] text-[#adc6ff] font-sans">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 h-16 border-b border-[#2a3150] bg-[#0c1324]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link
              to="/"
              className="bg-gradient-to-r from-[#adc6ff] to-[#d0bcff] bg-clip-text text-xl font-bold text-transparent"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              DirectHire
            </Link>

            {/* Desktop Links */}
            {token ? (
              <div className="hidden items-center gap-8 md:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="group relative flex items-center gap-1.5 text-sm font-medium text-[#8b92b4] transition-colors hover:text-[#adc6ff]"
                  >
                    <link.icon size={16} />
                    {link.label}
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-[#adc6ff] to-[#d0bcff] transition-all duration-200 group-hover:w-full" />
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#8b92b4] transition-colors hover:text-red-400"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-6 md:flex">
                <Link
                  to="/login"
                  className="text-sm font-medium text-[#8b92b4] transition-colors hover:text-[#adc6ff]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-gradient-to-r from-[#adc6ff] to-[#d0bcff] px-4 py-2 text-sm font-medium text-[#0c1324] transition-opacity hover:opacity-90"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-[#8b92b4] transition-colors hover:bg-[#151b2d] hover:text-[#adc6ff] md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Drawer */}
        {token && mobileOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-[#0c1324]/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-[#2a3150] bg-[#151b2d] p-6 shadow-lg md:hidden"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-[#8b92b4] transition-colors hover:bg-[#2a3150] hover:text-[#adc6ff]"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 text-lg font-medium text-[#8b92b4] transition-colors hover:text-[#adc6ff]"
                  >
                    <link.icon size={20} />
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="mt-4 flex items-center gap-3 text-lg font-medium text-red-400 transition-colors hover:text-red-300"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
          className="flex-1"
        >
          <Outlet />
        </motion.main>

        {/* Footer */}
        <footer className="border-t border-[#2a3150] py-6 text-center text-sm text-[#8b92b4]">
          <p>DirectHire - The autonomous hiring platform</p>
        </footer>
      </div>
    </ToastProvider>
  )
}