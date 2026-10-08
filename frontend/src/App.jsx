import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import AppLayout from './layout/AppLayout.jsx'
import LandingPage from './pages/landing/LandingPage.jsx'
import AIInvestigatorPage from './pages/AIInvestigatorPage.jsx'
import { SignInPage, SignUpPage } from './pages/AuthPage.jsx'
import InsightsPage from './pages/InsightsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import RecoveryPage from './pages/RecoveryPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import TransactionDetailPage from './pages/TransactionDetailPage.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'
import { ThemeProvider } from './theme/ThemeProvider.jsx'

function ProtectedTransactionsRedirect() {
  const { pathname, search, hash } = useLocation()
  return (
    <ProtectedRoute>
      <Navigate to={`/dashboard${pathname}${search}${hash}`} replace />
    </ProtectedRoute>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<OverviewPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="transactions/:transactionId" element={<TransactionDetailPage />} />
              <Route path="recovery" element={<RecoveryPage />} />
              <Route path="investigator" element={<AIInvestigatorPage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="/transactions/*" element={<ProtectedTransactionsRedirect />} />
            <Route path="/recovery" element={<ProtectedRoute><Navigate to="/dashboard/recovery" replace /></ProtectedRoute>} />
            <Route path="/investigator" element={<ProtectedRoute><Navigate to="/dashboard/investigator" replace /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute><Navigate to="/dashboard/insights" replace /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Navigate to="/dashboard/settings" replace /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
