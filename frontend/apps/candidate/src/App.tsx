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
import { MockInterview } from './pages/MockInterview'
import { NotFound } from './pages/NotFound'
import { ProtectedRoute, PublicRoute } from '@directhire/shared'

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
          <Route
            index
            element={
              <ProtectedRoute>
                <PageWrapper><Home /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="login"
            element={
              <PublicRoute>
                <PageWrapper><Login /></PageWrapper>
              </PublicRoute>
            }
          />
          <Route
            path="register"
            element={
              <PublicRoute>
                <PageWrapper><Register /></PageWrapper>
              </PublicRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <PageWrapper><Profile /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="jobs"
            element={
              <ProtectedRoute>
                <PageWrapper><Jobs /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="jobs/:id"
            element={
              <ProtectedRoute>
                <PageWrapper><JobDetail /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="applications"
            element={
              <ProtectedRoute>
                <PageWrapper><Applications /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="offers"
            element={
              <ProtectedRoute>
                <PageWrapper><Offers /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="agent"
            element={
              <ProtectedRoute>
                <PageWrapper><Agent /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="interview/:interviewId"
            element={
              <ProtectedRoute>
                <PageWrapper><MockInterview /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="mock-interview"
            element={
              <ProtectedRoute>
                <PageWrapper><MockInterview /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default App