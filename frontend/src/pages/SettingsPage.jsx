import { KeyRound, Link2, Sparkles } from 'lucide-react'
import { useApiData } from '../api/useApiData.js'
import { ErrorState, LoadingState } from '../components/DataStates.jsx'
import PageHeader from '../components/PageHeader.jsx'

export default function SettingsPage() {
  const healthRequest = useApiData('/api/health')
  const paypalRequest = useApiData('/api/paypal/status')
  const data = healthRequest.data
  const paypal = paypalRequest.data
  const error = healthRequest.error || paypalRequest.error
  const loading = healthRequest.loading || paypalRequest.loading
  const retry = () => {
    healthRequest.retry()
    paypalRequest.retry()
  }
  const paypalStatusLabel = paypal?.connected
    ? 'Sandbox API ready'
    : paypal?.configured
      ? 'Sandbox API unavailable'
      : 'Sandbox setup required'
  const paypalStatusClass = paypal?.connected ? 'status-succeeded' : 'status-failed'

  return <>
    <PageHeader eyebrow="WORKSPACE CONFIGURATION" title="Settings" description="Manage your PayLens workspace and PayPal Sandbox API." />
    {loading ? <LoadingState label="Checking integration status" /> : error ? <ErrorState error={error} onRetry={retry} /> : <div className="page-stack">
      <div className="settings-grid">
        <section className="settings-card"><div className="settings-card-head"><span className="settings-icon"><Link2 size={16} /></span><div><h2>PayPal Sandbox</h2><p>PayLens demo payment environment</p></div><span className={`status-badge ${paypalStatusClass}`}><i />{paypalStatusLabel}</span></div><div className="settings-row"><span>Environment</span><strong>PayPal Sandbox</strong></div><div className="settings-row"><span>Credentials handling</span><strong>Backend only</strong></div><div className="settings-note">{paypal?.connected ? 'PayLens is authenticated with its configured PayPal Sandbox REST app. Create an order on Recovery, approve it with a Sandbox buyer, then capture it in PayLens.' : paypal?.error || (paypal?.configured ? 'PayLens Sandbox credentials are configured, but OAuth could not be verified.' : 'Configure the PayPal Sandbox REST app client ID and secret in the backend environment.')}</div></section>
        <section className="settings-card"><div className="settings-card-head"><span className="settings-icon"><Sparkles size={16} /></span><div><h2>AI Investigator</h2><p>Analysis provider</p></div><span className="mock-label">MOCK</span></div><div className="settings-row"><span>Current provider</span><strong>{data.integrations.ai_analysis}</strong></div><div className="settings-row"><span>Environment variable</span><strong>AI_API_KEY</strong></div><div className="settings-note">Investigation responses are generated from sample transaction fields by a replaceable backend service.</div></section>
        <section className="settings-card"><div className="settings-card-head"><span className="settings-icon"><KeyRound size={16} /></span><div><h2>Environment</h2><p>Runtime status</p></div><span className="status-badge status-succeeded"><i />{data.status}</span></div><div className="settings-row"><span>API service</span><strong>{data.service}</strong></div><div className="settings-row"><span>Data mode</span><strong>{data.data_mode}</strong></div><div className="settings-row"><span>Credentials handling</span><strong>Backend environment only</strong></div></section>
      </div>
      <div className="demo-caption">PayPal Sandbox orders are separate from the illustrative Demo Mode transactions. Checkout creation does not capture a payment.</div>
    </div>}
  </>
}
