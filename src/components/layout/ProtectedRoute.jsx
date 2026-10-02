import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AppLayout from './AppLayout'
import Loader from '../common/Loader'
import { CLEANER_ROLES } from '../../routeGroups'

const ProtectedRoute = ({ children, allowedRoles = [], showHeader = true }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Show loading while checking authentication
  if (loading) {
    return <Loader fullscreen message="Checking your access..." />
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles.length > 0) {
    const userRole = user.role || user.userType
    const hasAccess = allowedRoles.includes(userRole)

    if (!hasAccess) {
      // Redirect to appropriate dashboard based on user role. This used to
      // redirect silently, which is confusing on its own (reported as
      // "provider and customer mixing up" - someone posts a job as a guest,
      // but is logged in on their cleaner account, then gets bounced to the
      // cleaner dashboard with zero explanation when they try to view it).
      // Passing a reason in state lets the destination dashboard explain
      // what happened instead of just silently swapping the page on them.
      if (userRole === 'Customer') {
        return (
          <Navigate
            to="/customer-dashboard"
            replace
            state={{
              roleRedirectReason:
                "That page is for service providers. You're logged in with a customer account, so here's your customer dashboard instead.",
            }}
          />
        )
      } else if (CLEANER_ROLES.includes(userRole)) {
        return (
          <Navigate
            to="/cleaner-dashboard"
            replace
            state={{
              roleRedirectReason:
                "That page is for customers. You're logged in with a service provider account, so here's your provider dashboard instead. To post and track a job as a customer, log in with a customer account.",
            }}
          />
        )
      } else {
        return <Navigate to="/login" replace />
      }
    }
  }

  return <AppLayout showHeader={showHeader}>{children}</AppLayout>
}

export default ProtectedRoute
