import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Profile } from './pages/Profile'
import { Jobs } from './pages/Jobs'
import { JobDetail } from './pages/JobDetail'
import { Applications } from './pages/Applications'
import { Offers } from './pages/Offers'
import { Agent } from './pages/Agent'
import { NotFound } from './pages/NotFound'

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -15 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
)

const App: React.FC = () => {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="register" element={<PageWrapper><Register /></PageWrapper>} />
          <Route path="profile" element={<PageWrapper><Profile /></PageWrapper>} />
          <Route path="jobs" element={<PageWrapper><Jobs /></PageWrapper>} />
          <Route path="jobs/:id" element={<PageWrapper><JobDetail /></PageWrapper>} />
          <Route path="applications" element={<PageWrapper><Applications /></PageWrapper>} />
          <Route path="offers" element={<PageWrapper><Offers /></PageWrapper>} />
          <Route path="agent" element={<PageWrapper><Agent /></PageWrapper>} />
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default App
