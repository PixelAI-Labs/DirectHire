import React from 'react'
import { Outlet } from 'react-router-dom'
import { ToastProvider, Navbar, Footer } from '@directhire/shared'
import { motion } from 'framer-motion'

export const Layout: React.FC = () => {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-background text-text font-body">
        <Navbar variant="recruiter" />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
          className="flex-1"
        >
          <Outlet />
        </motion.main>
        <Footer />
      </div>
    </ToastProvider>
  )
}