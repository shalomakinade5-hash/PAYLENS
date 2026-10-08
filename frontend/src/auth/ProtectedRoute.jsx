import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth.js'

export function AuthLoading() {
  return <main className="auth-loading" role="status">Restoring your secure session…</main>
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoading />
  if (!user) return <Navigate to="/signin" replace state={{ from: location }} />
  return children
}
