import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.98, y: -10 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
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
          <Route path="dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default App
