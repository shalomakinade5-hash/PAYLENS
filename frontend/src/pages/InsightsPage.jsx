import { Activity, Sparkles } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'

export default function InsightsPage() {
  return <>
    <PageHeader eyebrow="PAYMENT INTELLIGENCE" title="Insights" description="Understand payment patterns as your connected transaction history grows." />
    <section className="panel panel-pad insights-empty">
      <span className="insights-empty-icon"><Activity size={18} /></span>
      <span className="mock-label"><Sparkles size={11} />IN DEVELOPMENT</span>
      <h2>Insights are not connected yet</h2>
      <p>PayLens will surface evidence-backed payment patterns here once live or merchant-owned transaction data is available. No sample insight is being presented as a real finding.</p>
    </section>
  </>
}
