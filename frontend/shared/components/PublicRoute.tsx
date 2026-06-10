import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface PublicRouteProps {
  children: React.ReactNode
  allowedRoles?: ('CANDIDATE' | 'RECRUITER' | 'ADMIN')[]
  redirectTo?: string
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  allowedRoles: _allowedRoles,
  redirectTo,
}) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const location = useLocation()

  if (token && user) {
    // User is authenticated - redirect based on role
    const from = location.state?.from?.pathname
    if (from) {
      return <Navigate to={from} replace />
    }

    if (redirectTo) {
      return <Navigate to={redirectTo} replace />
    }

    // Default redirects based on role
    if (user.role === 'CANDIDATE') {
      return <Navigate to="/jobs" replace />
    } else if (user.role === 'RECRUITER' || user.role === 'ADMIN') {
      return <Navigate to="/dashboard" replace />
    }
  }

  // Not authenticated, allow access to public route
  return <>{children}</>
}