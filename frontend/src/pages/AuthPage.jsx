import { useState } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { isSupabaseConfigured } from '../auth/supabase.js'
import { AuthLoading } from '../auth/ProtectedRoute.jsx'
import './AuthPage.css'

function AuthFrame({ mode, children }) {
  const isSignUp = mode === 'signup'
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link className="auth-brand" to="/" aria-label="PayLens home">
          <span className="auth-brand-mark"><Eye size={19} strokeWidth={2.2} /></span>
          <span>PayLens<span className="auth-brand-period">.</span></span>
        </Link>
        <div className="auth-story-content">
          <span className="auth-kicker"><Sparkles size={13} /> PAYMENT RECOVERY INTELLIGENCE</span>
          <h1>{isSignUp ? <>Protect the revenue<br /><span>you worked to earn.</span></> : <>Good to have<br /><span>you back.</span></>}</h1>
          <p>{isSignUp
            ? 'Create your PayLens workspace to bring payment activity, recovery opportunities, and clear next steps into one view.'
            : 'Sign in to see the payment signals and recovery opportunities that need your attention.'}</p>
          <div className="auth-proof"><LockKeyhole size={14} /><span>Your PayLens account is separate from your PayPal connection.</span></div>
        </div>
        <span className="auth-story-footer">PAYLENS <i /> PAYMENT CLARITY, BUILT FOR MERCHANTS</span>
      </section>
      <section className="auth-form-side">
        <Link className="auth-back" to="/"><ArrowLeft size={14} />Back to PayLens</Link>
        <div className="auth-card">
          <span className="auth-card-kicker">{isSignUp ? 'START YOUR WORKSPACE' : 'SECURE WORKSPACE ACCESS'}</span>
          <h2>{isSignUp ? 'Create your account' : 'Welcome back'}</h2>
          <p className="auth-card-subtitle">{isSignUp ? 'Set up your merchant workspace in a moment.' : 'Enter your credentials to continue to your workspace.'}</p>
          {children}
          <p className="auth-switch">
            {isSignUp ? 'Already have a PayLens account?' : 'New to PayLens?'}
            {' '}<Link to={isSignUp ? '/signin' : '/signup'}>{isSignUp ? 'Sign in' : 'Create an account'}</Link>
          </p>
        </div>
        <p className="auth-security"><LockKeyhole size={12} />Encrypted account access · PayPal connects separately</p>
      </section>
    </main>
  )
}

function AuthForm({ mode }) {
  const isSignUp = mode === 'signup'
  const { user, loading, signIn, signUp } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const requestedPath = location.state?.from
  const redirectTo = requestedPath?.pathname?.startsWith('/')
    && !requestedPath.pathname.startsWith('//')
    ? `${requestedPath.pathname}${requestedPath.search || ''}${requestedPath.hash || ''}`
    : '/dashboard'

  if (loading) return <AuthLoading />
  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (isSignUp && businessName.trim().length < 2) {
      setError('Enter a business name with at least 2 characters.')
      return
    }
    if (isSignUp && password !== confirmPassword) {
      setError('Your passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      if (isSignUp) {
        const { session } = await signUp(businessName.trim(), email.trim(), password)
        if (!session) {
          setNotice('Your account was created. Check your email to confirm your address, then sign in.')
          return
        }
      } else {
        await signIn(email.trim(), password)
      }
      navigate(redirectTo, { replace: true })
    } catch (authError) {
      setError(authError.message || 'We could not complete your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFrame mode={mode}>
      {!isSupabaseConfigured && <div className="auth-message auth-error" role="alert">Authentication is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable account access.</div>}
      <form className="auth-form" onSubmit={handleSubmit}>
        {isSignUp && <label className="auth-field">
          <span>Business name</span>
          <input autoComplete="organization" maxLength={100} minLength={2} onChange={(event) => setBusinessName(event.target.value)} placeholder="Your business or store" required value={businessName} />
        </label>}
        <label className="auth-field">
          <span>Email address</span>
          <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@business.com" required type="email" value={email} />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <span className="auth-password-wrap">
            <input autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder={isSignUp ? 'At least 8 characters' : 'Enter your password'} required type={showPassword ? 'text' : 'password'} value={password} />
            <button aria-label={showPassword ? 'Hide password' : 'Show password'} className="auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)} type="button">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
          </span>
        </label>
        {isSignUp
          ? <label className="auth-field">
              <span>Confirm password</span>
              <input autoComplete="new-password" minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" required type={showPassword ? 'text' : 'password'} value={confirmPassword} />
            </label>
          : <div className="auth-forgot"><button disabled title="Password recovery is not available yet" type="button">Forgot password?</button></div>}
        {error && <div className="auth-message auth-error" role="alert">{error}</div>}
        {notice && <div className="auth-message auth-notice" role="status">{notice}</div>}
        <button className="auth-submit" disabled={submitting || !isSupabaseConfigured} type="submit">
          {submitting ? 'Securing your account…' : isSignUp ? 'Create PayLens account' : 'Sign in to PayLens'}
          {!submitting && <ArrowRight size={15} />}
        </button>
        <p className="auth-terms">{isSignUp ? 'By creating an account, you agree to keep your account credentials secure.' : 'Your PayLens credentials are never shared with PayPal.'}</p>
      </form>
    </AuthFrame>
  )
}

export function SignInPage() {
  return <AuthForm mode="signin" />
}

export function SignUpPage() {
  return <AuthForm mode="signup" />
}
