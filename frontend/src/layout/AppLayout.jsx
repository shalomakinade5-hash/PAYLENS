import { useState } from 'react'
import { Activity, CreditCard, Eye, LayoutDashboard, Link2, LogOut, PackageCheck, Settings2, Sparkles } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { useApiData } from '../api/useApiData.js'
import ThemeToggle from '../components/ThemeToggle.jsx'
import './AppLayout.css'
import '../dashboard/Dashboard.css'
import '../theme/dashboard-theme.css'

const navItems = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Transactions', to: '/dashboard/transactions', icon: CreditCard },
  { label: 'Recovery', to: '/dashboard/recovery', icon: PackageCheck },
  { label: 'AI Investigator', to: '/dashboard/investigator', icon: Sparkles },
  { label: 'Insights', to: '/dashboard/insights', icon: Activity },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings2 },
]

function Brand() {
  return <NavLink className="brand" to="/dashboard" aria-label="PayLens dashboard"><span className="brand-mark"><Eye size={19} strokeWidth={2.2} /></span><span>PayLens</span><span className="brand-period">.</span></NavLink>
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const paypalConnection = useApiData('/api/paypal/status')
  const [logoutError, setLogoutError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const businessName = user?.user_metadata?.business_name || user?.email || 'PayLens account'
  const initials = businessName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const isPayPalConnected = paypalConnection.data?.connected === true
  const payPalStatusLabel = paypalConnection.loading
    ? 'Checking PayPal Sandbox…'
    : isPayPalConnected
      ? 'PayPal Sandbox OAuth verified'
      : 'PayPal Sandbox API unavailable'
  const activeTitle = navItems.find((item) => item.end ? pathname === item.to : pathname.startsWith(item.to))?.label || 'Overview'

  async function handleLogout() {
    setLoggingOut(true)
    setLogoutError('')
    try {
      await signOut()
      navigate('/', { replace: true })
    } catch (error) {
      setLogoutError(error.message || 'Could not sign out. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top"><Brand />
          <div className="workspace-switcher"><span className="workspace-avatar">{initials.slice(0, 1)}</span><span className="workspace-copy"><strong>{businessName}</strong><small>PayLens account</small></span></div>
          <div className="nav-label">WORKSPACE</div>
          <nav className="primary-nav" aria-label="Main navigation">{navItems.map(({ label, to, icon: Icon, end }) => <NavLink key={to} end={end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to={to}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></NavLink>)}</nav>
          <div className="nav-label connect-label">PAYMENT API</div>
          <NavLink className={({ isActive }) => `nav-item integration-nav${isActive ? ' active' : ''}`} to="/dashboard/settings"><Link2 size={17} strokeWidth={1.8} /><span>PayPal Sandbox</span><span className={`nav-dot${isPayPalConnected ? ' connected-dot' : ''}`} /></NavLink>
        </div>
        <div className="sidebar-bottom"><div className="sidebar-plan"><span className="plan-icon"><Activity size={15} /></span><div><strong>Recovery engine</strong><span>Demo data active</span></div><span className="status-dot" /></div><div className="profile-row"><span className="profile-avatar">{initials}</span><span className="profile-copy"><strong>{businessName}</strong><small>{user?.email}</small></span></div><button className="logout-button" disabled={loggingOut} onClick={handleLogout} type="button"><LogOut size={14} />{loggingOut ? 'Signing out…' : 'Log out'}</button>{logoutError && <p className="logout-error" role="alert">{logoutError}</p>}</div>
      </aside>
      <main className="main-content">
        <header className="topbar"><div className="mobile-brand"><Brand /></div><div className="breadcrumbs"><span>Workspace</span><span className="crumb-divider">/</span><strong>{activeTitle}</strong></div><div className="topbar-actions"><span className="demo-pill"><span />DEMO DATA</span><ThemeToggle /><span className="topbar-divider" /><div className="provider-status"><span className="provider-mark"><Link2 size={15} /></span><span><strong>PayPal Sandbox</strong><small className={isPayPalConnected ? 'provider-connected' : 'provider-disconnected'}>{payPalStatusLabel}</small></span><span className={`status-dot${isPayPalConnected ? '' : ' coral-dot'}`} /></div></div></header>
        <nav className="mobile-nav" aria-label="Main navigation">{navItems.map(({ label, to, icon: Icon, end }) => <NavLink key={to} end={end} className={({ isActive }) => `mobile-nav-link${isActive ? ' mobile-nav-active' : ''}`} to={to}><Icon size={15} />{label}</NavLink>)}</nav>
        <div className="dashboard-content"><Outlet /><footer className="page-footer"><span>PayLens <i>·</i> Recovery starts with clarity.</span><span>Demo workspace <i>·</i> No live payment data</span></footer></div>
      </main>
    </div>
  )
}