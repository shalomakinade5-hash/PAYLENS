import { useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Eye,
  Fingerprint,
  Gauge,
  Link2,
  Menu,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.js'
import ThemeToggle from '../../components/ThemeToggle.jsx'
import './Landing.css'

const previewTransactions = [
  { id: 'PL-3082', name: 'Maya Chen', amount: '$480.00', status: 'Failed', tone: 'error' },
  { id: 'PL-3081', name: 'Alex Morgan', amount: '$192.50', status: 'Succeeded', tone: 'success' },
  { id: 'PL-3080', name: 'Riley James', amount: '$1,240.00', status: 'Review', tone: 'warning' },
]

function SectionLabel({ number }) {
  return <div className="landing-label"><span>{number || 'PAYLENS INTELLIGENCE'}</span><i /></div>
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, loading } = useAuth()

  return (
    <header className="landing-nav-wrap">
      <nav className="landing-nav" aria-label="Main navigation">
        <a className="landing-brand" href="#top" aria-label="PayLens home">
          <span className="landing-brand-mark"><Eye size={18} strokeWidth={2.2} /></span>
          <span>PayLens</span>
        </a>
        <div className={`landing-nav-links${menuOpen ? ' is-open' : ''}`} id="landing-navigation" onClick={() => setMenuOpen(false)}>
          <a href="#product">Product</a>
          <a href="#how-it-works">How it works</a>
          <a href="#investigator">AI Investigator</a>
          <a href="#recovery">Recovery</a>
        </div>
        <div className="landing-nav-actions">
          {!loading && !user && <Link className="landing-sign-in" to="/signin">Sign In</Link>}
          <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="landing-navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={17} /> : <Menu size={17} />}</button>
          <ThemeToggle />
          {!loading && !user && <Link className="button button-secondary landing-sign-up" to="/signup">Sign Up</Link>}
          {!loading && user && <Link className="button button-primary nav-dashboard" to="/dashboard">Go to Dashboard <ArrowRight size={14} /></Link>}
        </div>
      </nav>
    </header>
  )
}

function ProductPreview() {
  return (
    <div className="product-preview" aria-label="PayLens product preview using sample dashboard data">
      <div className="preview-window-top"><span className="preview-window-dots"><i /><i /><i /></span><span className="preview-window-name"><span className="landing-brand-mark small"><Eye size={12} /></span>PayLens <i>/</i> Merchant overview</span><span className="preview-demo-label"><span />DEMO PREVIEW</span></div>
      <div className="preview-dashboard">
        <aside className="preview-sidebar" aria-hidden="true"><span className="preview-sidebar-logo"><Eye size={14} /></span><i className="preview-nav-active" /><i /><i /><i /><span className="preview-sidebar-foot" /></aside>
        <div className="preview-main">
          <div className="preview-dashboard-header"><div><span className="preview-kicker">PAYMENT INTELLIGENCE</span><strong>Your payment pulse</strong></div><span className="preview-period"><Clock3 size={12} />Sample period</span></div>
          <div className="preview-metrics">
            <div className="preview-metric"><span>Successful</span><strong>$28,460</strong><small className="preview-positive"><ArrowUpRight size={11} /> demo volume</small></div>
            <div className="preview-metric"><span>Failed</span><strong>42</strong><small className="preview-negative"><ArrowDownRight size={11} /> sample payments</small></div>
            <div className="preview-metric"><span>Opportunities</span><strong>17</strong><small className="preview-opportunity"><Target size={11} /> to review</small></div>
            <div className="preview-metric"><span>Revenue at risk</span><strong>$4,820</strong><small className="preview-opportunity"><Activity size={11} /> illustrative</small></div>
          </div>
          <div className="preview-chart-panel"><div className="preview-chart-head"><div><span>Payment activity</span><small>Example transaction flow</small></div><span className="preview-chart-legend"><i />Captured <i />At risk</span></div><div className="preview-chart"><div className="preview-chart-grid"><i /><i /><i /></div><div className="preview-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="preview-chart-line" aria-hidden="true" /></div></div>
          <div className="preview-lower-grid"><div className="preview-recent"><div className="preview-section-head"><strong>Recent payments</strong><span>Sample data</span></div>{previewTransactions.map((transaction) => <div className="preview-transaction" key={transaction.id}><span className="preview-transaction-icon"><CircleDollarSign size={13} /></span><span className="preview-customer"><strong>{transaction.name}</strong><small>{transaction.id}</small></span><strong className="preview-amount">{transaction.amount}</strong><span className={`preview-status ${transaction.tone}`}>{transaction.status}</span></div>)}</div><div className="preview-ai"><span className="preview-ai-label"><Sparkles size={12} />AI INSIGHT PREVIEW</span><strong>One failed payment needs a closer look.</strong><span className="preview-ai-copy">Sample signal · no AI provider connected</span><span className="preview-ai-footer"><span /><span /><span /></span></div></div>
        </div>
      </div>
      <div className="preview-foot"><span><BadgeCheck size={12} /> Illustrative product preview</span><span>Not connected to PayPal</span></div>
    </div>
  )
}

function Hero() {
  return (
    <section className="landing-hero landing-container" id="top">
      <div className="hero-copy">
        <div className="hero-eyebrow"><span className="hero-eyebrow-icon"><Activity size={14} /></span>PAYMENT RECOVERY INTELLIGENCE</div>
        <h1>Your payments tell a story.<br /><span>PayLens finds the money you're missing.</span></h1>
        <p className="hero-description">PayLens uses AI to investigate failed and abandoned PayPal payments, identify high-value recovery opportunities, and tell merchants what to do next.</p>
        <p className="hero-positioning">PayPal moves the money. <strong>PayLens fights for the money you were about to lose.</strong></p>
        <div className="hero-actions"><a className="button button-primary hero-primary" href="#product">Explore PayLens <ArrowRight size={15} /></a><a className="button button-secondary hero-secondary" href="#how-it-works">See how it works <ChevronRight size={15} /></a></div>
        <div className="hero-proof"><span><ShieldAlert size={14} />Built for payment clarity</span><i /><span>Preview environment · sample data</span></div>
      </div>
      <div className="hero-visual"><div className="hero-visual-glow" /><ProductPreview /><div className="hero-visual-note"><span className="hero-note-dot" />Signal → explanation → next best action</div></div>
    </section>
  )
}

function ProblemSection() {
  return (
    <section className="problem-section landing-section" id="problem">
      <div className="landing-container problem-layout">
        <div className="problem-copy"><SectionLabel number="01 / THE GAP" /><h2>A failed payment is more than a red status.</h2><p>Merchants see the event. The reason, the pattern, and the next best move are often scattered or unclear.</p><div className="problem-questions"><span>Why did it happen?</span><span>Is the customer worth recovering?</span><span>What should I do next?</span></div></div>
        <div className="problem-flow" aria-label="Common payment statuses and the unanswered question">
          <div className="problem-status-row"><span className="problem-status-icon error"><ArrowDownRight size={15} /></span><span>Payment Failed</span><span className="problem-status-code">DECLINED</span></div>
          <div className="problem-status-row"><span className="problem-status-icon warning"><Clock3 size={15} /></span><span>Payment Abandoned</span><span className="problem-status-code">INCOMPLETE</span></div>
          <div className="problem-status-row"><span className="problem-status-icon neutral"><CircleDollarSign size={15} /></span><span>Payment Cancelled</span><span className="problem-status-code">CANCELLED</span></div>
          <div className="problem-why"><span className="problem-why-mark"><Search size={17} /></span><span><small>THE QUESTION THAT MATTERS</small><strong>Why did it happen?</strong></span><span className="problem-why-arrow"><ArrowRight size={15} /></span></div>
        </div>
      </div>
      <div className="landing-container problem-transition"><span className="transition-rule" /><p><strong>PayLens turns payment events into actionable intelligence.</strong><span>See what happened, understand the signal, and focus your attention where it matters.</span></p></div>
    </section>
  )
}

function FeatureSection() {
  const features = [
    { icon: Search, number: '01', title: 'Investigate', body: 'Ask what happened to a payment and get a clear explanation grounded in the transaction details available to PayLens.', note: 'Explain the event' },
    { icon: Activity, number: '02', title: 'Detect', body: 'Surface unusual behavior, repeated attempts, failed transactions, and payment patterns that deserve a closer look.', note: 'Find the signal' },
    { icon: Target, number: '03', title: 'Prioritize recovery', body: 'Organize potential opportunities by value and context, then review a suggested next step before taking action yourself.', note: 'Focus your effort' },
  ]
  return (
    <section className="feature-section landing-section" id="product">
      <div className="landing-container"><div className="section-heading"><SectionLabel number="02 / THE PRODUCT" /><h2>From payment data to action.</h2><p>One place to understand the signal behind a lost payment and decide what deserves attention.</p></div>
        <div className="feature-grid">{features.map(({ icon: Icon, number, title, body, note }) => <article className="feature-item" key={number}><div className="feature-top"><span className="feature-icon"><Icon size={18} /></span><span>{number}</span></div><h3>{title}</h3><p>{body}</p><div className="feature-rule" /><span className="feature-note"><i />{note}</span></article>)}</div>
        <p className="feature-disclaimer"><span />PayLens is in development. Suggestions are for merchant review; no payment or recovery action is automated.</p>
      </div>
    </section>
  )
}

function InvestigatorPreview() {
  return (
    <section className="investigator-section landing-section" id="investigator">
      <div className="landing-container investigator-layout">
        <div className="investigator-copy"><SectionLabel number="03 / AI INVESTIGATOR" /><h2>Ask a better question.<br /><span>Get a clearer answer.</span></h2><p>Move from a payment status to the context behind it. The PayLens Investigator preview explains sample transaction signals and highlights what may merit a manual review.</p><div className="investigator-points"><span><Check size={14} />Evidence tied to transaction details</span><span><Check size={14} />Context before suggested action</span><span><Check size={14} />Merchant stays in control</span></div><Link className="inline-link" to="/dashboard/investigator">Explore the demo investigator <ArrowRight size={14} /></Link></div>
        <div className="investigator-window">
          <div className="investigator-window-head"><span className="investigator-window-icon"><Sparkles size={15} /></span><span><strong>Payment investigation</strong><small>Sample transaction · PL-3082</small></span><span className="demo-tag">PREVIEW</span></div>
          <div className="investigator-question"><span>MERCHANT ASKS</span><p>“Why did this $480 payment fail?”</p></div>
          <div className="investigator-answer"><div className="investigator-answer-title"><span><Sparkles size={14} />PAYLENS ANALYSIS</span><span className="mock-tag">MOCK RESPONSE</span></div><h3>Payment Investigation</h3><div className="investigator-facts"><div><span>Status</span><strong className="status-text-error"><i />Failed</strong></div><div><span>Pattern detected</span><strong>3 payment attempts</strong></div><div><span>Recovery opportunity</span><strong className="status-text-warning"><i />High</strong></div></div><div className="investigator-explanation"><span>WHAT HAPPENED</span><p>The payment was attempted multiple times but was not completed.</p></div><div className="investigator-recommendation"><span><Target size={14} />RECOMMENDED ACTION</span><strong>Invite the customer to retry payment.</strong><small>Preview suggestion only · no message sent</small></div></div>
          <div className="investigator-window-foot"><span><i />Sample response generated by a backend mock</span><span>Not a real AI analysis</span></div>
        </div>
      </div>
    </section>
  )
}

function RecoveryPreview() {
  const rows = [
    { customer: 'Maya Chen', initials: 'MC', amount: '$480.00', status: 'Failed', tone: 'error', reason: 'Repeated attempts', potential: 'High', action: 'Invite to retry' },
    { customer: 'Jordan Blake', initials: 'JB', amount: '$265.00', status: 'Abandoned', tone: 'warning', reason: 'Checkout not completed', potential: 'Medium', action: 'Review order context' },
    { customer: 'Sam Rivera', initials: 'SR', amount: '$1,120.00', status: 'Failed', tone: 'error', reason: 'Funding source declined', potential: 'High', action: 'Review manually' },
  ]
  return (
    <section className="recovery-section landing-section" id="recovery">
      <div className="landing-container">
        <div className="recovery-heading"><div><SectionLabel number="04 / RECOVERY INTELLIGENCE" /><h2>Don't treat every failed payment equally.</h2><p>Bring the amount, reason, and recovery context together so merchants can prioritize a thoughtful follow-up.</p></div><div className="recovery-preview-badge"><span />RECOVERY DASHBOARD · DEMO</div></div>
        <div className="recovery-dashboard">
          <div className="recovery-dashboard-top"><div><span className="recovery-dashboard-icon"><Gauge size={16} /></span><span><strong>Recovery overview</strong><small>Illustrative opportunity queue</small></span></div><span className="recovery-demo-label">SAMPLE DATA</span></div>
          <div className="recovery-stats"><div><span>Potentially recoverable</span><strong>$4,820</strong><small>Example amount · not a forecast</small></div><div><span>Opportunities</span><strong>17</strong><small>Sample records</small></div><div><span>High-value</span><strong>6</strong><small>Demo priority labels</small></div></div>
          <div className="recovery-table-wrap"><table className="recovery-table"><thead><tr><th>Customer</th><th>Amount</th><th>Status</th><th>Reason</th><th>Potential</th><th>Suggested next step</th></tr></thead><tbody>{rows.map((row) => <tr key={row.initials}><td><span className="recovery-customer"><i>{row.initials}</i>{row.customer}</span></td><td className="recovery-amount">{row.amount}</td><td><span className={`recovery-status ${row.tone}`}><i />{row.status}</span></td><td>{row.reason}</td><td><span className={`potential-label ${row.potential.toLowerCase()}`}>{row.potential}</span></td><td className="recommended-cell">{row.action}</td></tr>)}</tbody></table></div>
          <div className="recovery-dashboard-foot"><span><ShieldAlert size={13} />Recommendations are for manual review only.</span><span>Preview values are illustrative.</span></div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { number: '01', icon: Link2, title: 'Connect', status: 'NEXT DEVELOPMENT STAGE', description: 'Connect PayPal payment activity through the Sandbox, then normalize transaction events for the PayLens workspace.' },
    { number: '02', icon: Fingerprint, title: 'Investigate', status: 'MOCK PREVIEW AVAILABLE', description: 'Analyze payment behavior and explain transaction signals with context merchants can review.' },
    { number: '03', icon: Zap, title: 'Recover', status: 'MERCHANT-LED', description: 'Prioritize the opportunities worth pursuing. The merchant decides what happens next; PayLens takes no action automatically.' },
  ]
  return (
    <section className="how-section landing-section" id="how-it-works">
      <div className="landing-container how-layout"><div className="section-heading how-intro"><SectionLabel number="05 / THE WORKFLOW" /><h2>Three steps from signal to second look.</h2><p>Designed to help merchants understand payment events before deciding how to respond.</p></div><div className="how-steps">{steps.map(({ number, icon: Icon, title, status, description }) => <article className="how-step" key={number}><span className="how-step-number">{number}</span><span className="how-step-icon"><Icon size={17} /></span><div className="how-step-copy"><div className="how-step-title"><h3>{title}</h3><span>{status}</span></div><p>{description}</p></div><ArrowRight className="how-step-arrow" size={15} /></article>)}</div></div>
    </section>
  )
}

function MerchantOutcome() {
  return (
    <section className="outcome-section landing-section">
      <div className="landing-container outcome-layout"><div><SectionLabel number="06 / THE OUTCOME" /><h2>Turn missed transactions into revenue.</h2><p>PayLens gives payment events the context they need to become useful decisions, not just another row in a report.</p></div><div className="outcome-list"><div><span className="outcome-check"><Check size={14} /></span><span>Identify revenue at risk before it gets buried.</span></div><div><span className="outcome-check"><Check size={14} /></span><span>Understand what went wrong with a payment.</span></div><div><span className="outcome-check"><Check size={14} /></span><span>Prioritize high-value opportunities with context.</span></div><div><span className="outcome-check"><Check size={14} /></span><span>Reduce payment leakage with thoughtful follow-up.</span></div><div><span className="outcome-check"><Check size={14} /></span><span>Increase completed payments with informed follow-up.</span></div></div></div>
    </section>
  )
}

function FinalCTA() {
  return <section className="final-cta landing-section"><div className="landing-container final-cta-inner"><div className="final-cta-orbit" aria-hidden="true"><span /><span /><span /></div><SectionLabel number="07 / START WITH CLARITY" /><h2>Stop watching revenue disappear.</h2><p>Give every failed payment a second look.</p><div className="final-cta-actions"><a className="button button-primary hero-primary" href="#product">Explore PayLens <ArrowRight size={15} /></a><Link className="button button-secondary hero-secondary" to="/dashboard">View Dashboard <ArrowUpRight size={14} /></Link></div><small>Dashboard uses demo data. No PayPal account required.</small></div></section>
}

function Footer() {
  return (
    <footer className="landing-footer"><div className="landing-container footer-main"><div className="footer-brand-block"><a className="landing-brand" href="#top"><span className="landing-brand-mark"><Eye size={18} /></span><span>PayLens</span></a><p>AI-powered payment recovery intelligence for PayPal merchants.</p><small>Independent product concept. Not affiliated with PayPal.</small></div><nav className="footer-links" aria-label="Footer navigation"><a href="#product">Product</a><a href="#how-it-works">How it works</a><a href="#investigator">AI Investigator</a><a href="#recovery">Recovery</a><a href="https://github.com/shalomakinade5-hash/PAYLENS" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={12} /></a></nav><div className="footer-legal"><span>PAYMENT CLARITY, BUILT FOR MERCHANTS</span><span>Preview experience · Sample data</span></div></div></footer>
  )
}

export default function LandingPage() {
  return <div className="landing-page" id="top"><Navbar /><main><Hero /><ProblemSection /><FeatureSection /><InvestigatorPreview /><RecoveryPreview /><HowItWorks /><MerchantOutcome /><FinalCTA /></main><Footer /></div>
}