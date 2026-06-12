import React from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Companies } from './pages/Companies'
import { CompanyForm } from './pages/CompanyForm'
import { Jobs } from './pages/Jobs'
import { CreateJob } from './pages/CreateJob'
import { JobDetail } from './pages/JobDetail'
import { CandidateView } from './pages/CandidateView'
import { InterviewDetail } from './pages/InterviewDetail'
import { ProtectedRoute, PublicRoute } from '@directhire/shared'

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
          <Route
            index
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
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
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                <PageWrapper><Dashboard /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="companies"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                <PageWrapper><Companies /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="companies/create"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                <PageWrapper><CompanyForm mode="create" /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="companies/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                <PageWrapper><CompanyForm mode="edit" /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="jobs"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                <PageWrapper><Jobs /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="jobs/create"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                <PageWrapper><CreateJob /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="jobs/:id"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                <PageWrapper><JobDetail /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="candidates/:id"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                <PageWrapper><CandidateView /></PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="interviews/:id"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'ADMIN']}>
                <PageWrapper><InterviewDetail /></PageWrapper>
              </ProtectedRoute>
            }
          />
          {/* Catch-all route to redirect unknown URLs (like /candidates) to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default App