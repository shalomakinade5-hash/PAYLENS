import { useMemo } from 'react'
import { Activity, ArrowRight, Check, CircleDollarSign, CreditCard, Sparkles } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { useApiData } from '../api/useApiData.js'
import { EmptyState, ErrorState, LoadingState } from '../components/DataStates.jsx'
import PageHeader from '../components/PageHeader.jsx'
import TransactionTable from '../components/TransactionTable.jsx'
import { formatCurrency } from '../utils/format.js'

const EMPTY_TRANSACTIONS = []
const EMPTY_OPPORTUNITIES = []

function ActivityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tip"><strong>{label}</strong>{payload.map((item) => <div key={item.dataKey}>{item.name}: {item.value}</div>)}</div>
}

function makeActivity(transactions) {
  const grouped = new Map()
  const chronological = [...transactions].sort((left, right) => new Date(left.created_at) - new Date(right.created_at))
  for (const transaction of chronological) {
    const date = new Date(transaction.created_at)
    const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const item = grouped.get(key) || { date: key, successful: 0, atRisk: 0 }
    if (transaction.status === 'succeeded') item.successful += 1
    if (transaction.status === 'failed' || transaction.status === 'abandoned') item.atRisk += 1
    grouped.set(key, item)
  }
  return [...grouped.values()]
}

export default function OverviewPage() {
  const transactionsRequest = useApiData('/api/transactions')
  const recoveryRequest = useApiData('/api/recovery-opportunities')
  const transactions = transactionsRequest.data ?? EMPTY_TRANSACTIONS
  const opportunities = recoveryRequest.data ?? EMPTY_OPPORTUNITIES
  const activity = useMemo(() => makeActivity(transactions), [transactions])
  const processedUsd = transactions.filter((item) => item.currency === 'USD' && !['abandoned', 'pending'].includes(item.status))
  const successful = transactions.filter((item) => item.status === 'succeeded')
  const failed = transactions.filter((item) => item.status === 'failed')
  const successRate = processedUsd.length ? Math.round((successful.filter((item) => item.currency === 'USD').length / processedUsd.length) * 100) : 0
  const totalProcessed = processedUsd.reduce((sum, item) => sum + item.amount, 0)
  const failedSamples = failed.filter((item) => item.failure_code)
  const isLoading = transactionsRequest.loading || recoveryRequest.loading
  const error = transactionsRequest.error || recoveryRequest.error

  return <>
    <PageHeader eyebrow="MERCHANT OVERVIEW" title="Keep more of what you earn." description="A clear view of payment health and the opportunities worth a closer look." />
    {isLoading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={() => { transactionsRequest.retry(); recoveryRequest.retry() }} /> : <>
      <section className="metrics-grid overview-metrics" aria-label="Demo payment metrics">
        <article className="metric-card"><div className="metric-heading"><span>Total processed</span><span className="metric-icon lime"><WalletIcon /></span></div><div className="metric-value">{formatCurrency(totalProcessed)}</div><div className="metric-foot"><span className="kpi-subnote">USD demo attempts only</span></div></article>
        <article className="metric-card"><div className="metric-heading"><span>Successful payments</span><span className="metric-icon mint"><Check size={17} /></span></div><div className="metric-value">{successful.length}</div><div className="metric-foot"><span className="kpi-subnote">of {transactions.length} demo records</span></div></article>
        <article className="metric-card"><div className="metric-heading"><span>Failed payments</span><span className="metric-icon coral"><Activity size={17} /></span></div><div className="metric-value">{failed.length}</div><div className="metric-foot"><span className="kpi-subnote">sample records only</span></div></article>
        <article className="metric-card"><div className="metric-heading"><span>Recovery opportunities</span><span className="metric-icon blue"><CircleDollarSign size={17} /></span></div><div className="metric-value">{opportunities.length}</div><div className="metric-foot"><span className="kpi-subnote">potential, not recovered revenue</span></div></article>
        <article className="metric-card"><div className="metric-heading"><span>Payment success rate</span><span className="metric-icon mint"><CreditCard size={17} /></span></div><div className="metric-value">{successRate}%</div><div className="metric-foot"><span className="kpi-subnote">USD completed and failed demo attempts</span></div></article>
      </section>
      <div className="overview-layout">
        <div className="overview-main">
          <section className="panel panel-pad">
            <div className="panel-header"><div><h2>Payment activity</h2><p>Successful and at-risk sample transactions by day</p></div><span className="sample-label">DEMO DATA</span></div>
            {activity.length ? <div className="activity-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={activity} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="successFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#bbec70" stopOpacity={0.2} /><stop offset="100%" stopColor="#bbec70" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#282c28" strokeDasharray="3 5" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#747c73', fontSize: 9 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#747c73', fontSize: 9 }} /><Tooltip content={<ActivityTooltip />} /><Area name="Successful" dataKey="successful" type="monotone" stroke="#bbec70" fill="url(#successFill)" strokeWidth={2} /><Area name="At risk" dataKey="atRisk" type="monotone" stroke="#e98e70" fill="transparent" strokeWidth={1.6} /></AreaChart></ResponsiveContainer></div> : <EmptyState title="No activity yet" message="Activity appears here when transactions are available." />}
          </section>
          <section className="panel table-panel"><div className="panel-pad"><div className="panel-header"><div><h2>Recent transactions</h2><p>Every row is marked as demo data.</p></div><Link className="panel-link" to="/dashboard/transactions">All transactions <ArrowRight size={13} /></Link></div></div><TransactionTable transactions={transactions.slice(0, 5)} compact /></section>
        </div>
        <aside className="overview-aside">
          <section className="panel panel-pad insight-preview"><div className="panel-header"><div><h2><Sparkles size={14} /> AI insights</h2><p>Mock signal from the demo dataset</p></div><span className="mock-label">MOCK</span></div><h3>{failedSamples.length ? `${failedSamples.length} sample declines include failure details.` : 'No sample decline details found.'}</h3><p>This is a data summary, not AI analysis. The Investigator uses a clearly labeled mock service until a provider is connected.</p><Link className="panel-link" to="/dashboard/investigator">Open AI Investigator <ArrowRight size={13} /></Link></section>
          <section className="panel panel-pad"><div className="panel-header"><div><h2>Recovery opportunities</h2><p>Potential recoveries for review, not actions taken.</p></div><Link className="panel-link" to="/dashboard/recovery">View all <ArrowRight size={13} /></Link></div>{opportunities.length ? <div className="opportunity-list">{opportunities.slice(0, 3).map((item) => <div className="opportunity-row" key={item.opportunity_id}><div className="opportunity-name">{item.customer_name}</div><div className="opportunity-amount">{formatCurrency(item.amount, item.currency)}</div><div className="opportunity-reason">{item.reason}</div></div>)}</div> : <EmptyState title="No opportunities" message="There are no demo recovery candidates." />}</section>
        </aside>
      </div>
      <div className="demo-caption"><Check size={13} />Temporary demo data from the PayLens API. No live PayPal transactions or AI provider are connected.</div>
    </>}
  </>
}

function WalletIcon() {
  return <CircleDollarSign size={17} />
}