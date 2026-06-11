import './App.css'
import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
const HomePage = React.lazy(() => import('./pages/HomePage'))
import { ProtectedRoute, ScrollToTop, Loader, Footer } from './components'
import { authRoutes, customerRoutes, cleanerRoutes, CLEANER_ROLES } from './routeGroups'
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'))

const AboutPage = React.lazy(() => import('./pages/legal/AboutPage'))
const ContactPage = React.lazy(() => import('./pages/legal/ContactPage'))
const PrivacyPolicyPage = React.lazy(() => import('./pages/legal/PrivacyPolicyPage'))
const TermsPage = React.lazy(() => import('./pages/legal/TermsPage'))
const ServicesPage = React.lazy(() => import('./pages/ServicesPage'))

function AppContent() {
  const location = useLocation()
  
  // Hide footer on chat pages (cleaner chat, customer chat, live chat)
  const isChatPage = location.pathname.toLowerCase().includes('chat')

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col [&>div]:flex-grow">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />
          {authRoutes.map(({ path, component: Component }, i) => (
            <Route key={i} path={path} element={<Component />} />
          ))}

          {/* Customer protected */}
          {customerRoutes.map(({ path, component: Component, allowedRoles, showHeader }, i) => (
            <Route
              key={i}
              path={path}
              element={
                <ProtectedRoute allowedRoles={allowedRoles || ['Customer']} showHeader={showHeader !== false}>
                  <Component />
                </ProtectedRoute>
              }
            />
          ))}

          {/* Cleaner protected */}
          {cleanerRoutes.map(({ path, component: Component, allowedRoles, showHeader }, i) => (
            <Route
              key={i}
              path={path}
              element={
                <ProtectedRoute allowedRoles={allowedRoles || CLEANER_ROLES} showHeader={showHeader !== false}>
                  <Component />
                </ProtectedRoute>
              }
            />
          ))}

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isChatPage && <Footer />}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<Loader fullscreen message="Setting up your Aussie Mate journey..." />}>
          <AppContent />
        </Suspense>
      </Router>
    </AuthProvider>
  )
}

export default App
