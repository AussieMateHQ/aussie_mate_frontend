import React from 'react'
import { Navigate } from 'react-router-dom'

import PlatformPolicyPage from './pages/legal/PlatformPolicyPage'



export const CLEANER_ROLES = [
  'Professional Cleaner',
  'Student Cleaner',
  'Retail Auditor',
  'Pet Sitter',
  'Housekeeper',
  'Cleaner',
]



// Auth pages

const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'))

const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage'))

const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage'))

const VerifyDocumentsPage = React.lazy(() => import('./pages/auth/VerifyDocumentsPage'))



// Customer pages

const CustomerDashboard = React.lazy(() => import('./pages/customer/CustomerDashboard'))

const JobSuccessPage = React.lazy(() => import('./pages/customer/JobSuccessPage'))

const MyJobsPage = React.lazy(() => import('./pages/customer/MyJobsPage'))

const CustomerJobDetailsPage = React.lazy(() => import('./pages/customer/CustomerJobDetailsPage'))

const JobDetailsCompletedPage = React.lazy(() => import('./pages/customer/JobDetailsCompletedPage'))

const CustomerChatPage = React.lazy(() => import('./pages/customer/CustomerChatPage'))

const ConfirmYourCleanerPage = React.lazy(() => import('./pages/customer/ConfirmYourCleanerPage'))

const JobBookedSuccessfullyPage = React.lazy(() => import('./pages/customer/JobBookedSuccessfullyPage'))

const CustomerInProgressJobDetailsPage = React.lazy(() => import('./pages/customer/CustomerInProgressJobDetailsPage'))

const JobDetailsPage = React.lazy(() => import('./pages/cleaner/JobDetailsPage'))

const PaymentSuccessCallbackPage = React.lazy(() => import('./pages/customer/PaymentSuccessCallbackPage'))



// Profile pages

const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage'))

const EditProfilePage = React.lazy(() => import('./pages/profile/EditProfilePage'))

const WalletPage = React.lazy(() => import('./pages/profile/customer/WalletPage'))

const MatePointsPage = React.lazy(() => import('./pages/profile/customer/MatePointsPage'))

const RewardSuccessPage = React.lazy(() => import('./pages/profile/customer/RewardSuccessPage'))

const InvoicesPage = React.lazy(() => import('./pages/profile/customer/InvoicesPage'))

const NotificationPage = React.lazy(() => import('./pages/profile/NotificationPage'))

const NotificationSettingsPage = React.lazy(() => import('./pages/profile/NotificationSettingsPage'))

const HelpSupportPage = React.lazy(() => import('./pages/profile/HelpSupportPage'))

const LiveChatPage = React.lazy(() => import('./pages/profile/LiveChatPage'))

const VerificationStatusPage = React.lazy(() => import('./pages/profile/cleaner/VerificationStatusPage'))

const AvailabilityPage = React.lazy(() => import('./pages/profile/cleaner/AvailabilityPage'))

const PaymentsPayoutsPage = React.lazy(() => import('./pages/profile/cleaner/PaymentsPayoutsPage'))

const ReviewsPage = React.lazy(() => import('./pages/profile/cleaner/ReviewsPage'))



// Cleaner pages

const SetCleanerLocationPage = React.lazy(() => import('./pages/cleaner/SetCleanerLocationPage'))

const CleanerDashboard = React.lazy(() => import('./pages/cleaner/CleanerDashboard'))

const CleanerJobsPage = React.lazy(() => import('./pages/cleaner/CleanerJobsPage'))

const InProgressJobDetailsPage = React.lazy(() => import('./pages/cleaner/InProgressJobDetailsPage'))

const CleanerJobCompletedPage = React.lazy(() => import('./pages/cleaner/CleanerJobCompletedPage'))

const CompleteJobPage = React.lazy(() => import('./pages/cleaner/CompleteJobPage'))

const CleanerChatPage = React.lazy(() => import('./pages/cleaner/CleanerChatPage'))

const EarningsPage = React.lazy(() => import('./pages/cleaner/EarningsPage'))
const MySubscriptionPage = React.lazy(() => import('./pages/cleaner/MySubscriptionPage'))
const BuyCreditsPage = React.lazy(() => import('./pages/cleaner/BuyCreditsPage'))
const SubscriptionSuccessPage = React.lazy(() => import('./pages/cleaner/SubscriptionSuccessPage'))
const CreditsSuccessPage = React.lazy(() => import('./pages/cleaner/CreditsSuccessPage'))
const LeadUsageHistoryPage = React.lazy(() => import('./pages/cleaner/LeadUsageHistoryPage'))

const StripeSuccessPage = React.lazy(() => import('./pages/StripeSuccessPage'))



export const authRoutes = [

  { path: '/login', component: LoginPage },

  // Old password-based signup/reset flow — replaced by the universal OTP
  // login page (it creates an account automatically for a brand-new phone
  // number), so these just redirect there instead of showing a dead-end
  // password form.
  { path: '/select-role', component: () => React.createElement(Navigate, { to: '/login', replace: true }) },

  { path: '/signup', component: () => React.createElement(Navigate, { to: '/login', replace: true }) },

  { path: '/forgot-password', component: () => React.createElement(Navigate, { to: '/login', replace: true }) },

  { path: '/reset-password', component: () => React.createElement(Navigate, { to: '/login', replace: true }) },

  { path: '/platform-policy', component: PlatformPolicyPage, showHeader: true },
]


export const customerRoutes = [

  // '/customer-dashboard' moved to a public route in App.jsx, and is now the
  // landing page at '/': CustomerDashboard already renders fine without a
  // user (guest-safe fetch guards added), so it no longer sits behind
  // ProtectedRoute. Logged-in customers still see their real data — the
  // component itself checks `user` from context either way.

  // '/post-new-job' moved to a public route in App.jsx: PostNewJobPage
  // already supports posting as a guest (isGuest = !user), so it no longer
  // sits behind ProtectedRoute — that's how the landing page reaches the
  // existing, approved job form without a login/signup wall.

  { path: '/job-success', component: JobSuccessPage },

  { path: '/my-jobs', component: MyJobsPage },

  { path: '/profile', component: ProfilePage, allowedRoles: ['Customer', ...CLEANER_ROLES] },

  { path: '/edit-profile', component: EditProfilePage, allowedRoles: ['Customer', ...CLEANER_ROLES] },

  { path: '/wallet', component: WalletPage },

  { path: '/rewards', component: MatePointsPage },

  { path: '/reward-success', component: RewardSuccessPage },

  { path: '/invoices', component: InvoicesPage },

  { path: '/notifications', component: NotificationPage, allowedRoles: ['Customer', ...CLEANER_ROLES] },

  { path: '/notifications-settings', component: NotificationSettingsPage, allowedRoles: ['Customer', ...CLEANER_ROLES] },

  { path: '/help', component: HelpSupportPage, allowedRoles: ['Customer', ...CLEANER_ROLES] },

  { path: '/live-chat', component: LiveChatPage },

  { path: '/customer-job-details/:jobId', component: CustomerJobDetailsPage },

  { path: '/job-completed/:jobId', component: JobDetailsCompletedPage },

  { path: '/customer-chat/:jobId', component: CustomerChatPage },

  { path: '/confirm-cleaner/:jobId', component: ConfirmYourCleanerPage },

  { path: '/booking-confirmation/:jobId', component: JobBookedSuccessfullyPage },

  { path: '/customer-in-progress-job/:jobId', component: CustomerInProgressJobDetailsPage },

  { path: '/payment/success', component: PaymentSuccessCallbackPage },

  { path: '/platform-policy', component: PlatformPolicyPage },

]



export const cleanerRoutes = [

  { path: '/verify-documents', component: VerifyDocumentsPage, showHeader: false },

  { path: '/verification', component: VerificationStatusPage },

  { path: '/availability', component: AvailabilityPage },

  { path: '/payments', component: PaymentsPayoutsPage },

  { path: '/reviews', component: ReviewsPage },

  { path: '/set-cleaner-location', component: SetCleanerLocationPage },
  { path: '/my-subscription', component: MySubscriptionPage },
  { path: '/cleaner-dashboard', component: CleanerDashboard },
  { path: '/buy-credits', component: BuyCreditsPage },
  { path: '/subscription/success', component: SubscriptionSuccessPage },
  { path: '/credits-success', component: CreditsSuccessPage },
  { path: '/lead-usage-history', component: LeadUsageHistoryPage },
  { path: '/subscription/cancel', component: () => React.createElement(Navigate, { to: "/my-subscription", replace: true }) },

  { path: '/cleaner-jobs', component: CleanerJobsPage },

  { path: '/job-details/:jobId', component: JobDetailsPage },

  { path: '/in-progress-job/:jobId', component: InProgressJobDetailsPage },

  { path: '/cleaner-job-completed/:jobId', component: CleanerJobCompletedPage },

  { path: '/cleaner/complete-job/:jobId', component: CompleteJobPage },

  { path: '/chat/:jobId', component: CleanerChatPage },

  { path: '/earnings', component: EarningsPage },

  { path: '/cleaner/stripe/success', component: StripeSuccessPage },

  { path: '/platform-policy', component: PlatformPolicyPage },

  // '/location' moved to a public route in App.jsx alongside '/post-new-job':
  // guests posting a job from the landing page need to set a location before
  // an account exists. LocationPage itself still sends a signed-in-required
  // visitor to /login for every other entry point (header "Change location",
  // dashboards, etc.) — only the guest-from-post-new-job path is exempt.

]
