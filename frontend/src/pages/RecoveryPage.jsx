import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, CircleCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../api/client.js'
import { useApiData } from '../api/useApiData.js'
import { ErrorState, LoadingState } from '../components/DataStates.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { formatCurrency, formatDate } from '../utils/format.js'

const EMPTY_OPPORTUNITIES = []

export default function RecoveryPage() {
  const { data, error, loading, retry } = useApiData('/api/recovery-opportunities')
  const [searchParams, setSearchParams] = useSearchParams()
  const [amount, setAmount] = useState('25.00')
  const [currency, setCurrency] = useState('USD')
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [checkingOrderStatus, setCheckingOrderStatus] = useState(false)
  const [capturingOrder, setCapturingOrder] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [order, setOrder] = useState(null)
  const returnedOrderId = searchParams.get('token')
  const opportunities = data ?? EMPTY_OPPORTUNITIES
  const totalsByCurrency = useMemo(() => opportunities.reduce((totals, item) => {
    totals[item.currency] = (totals[item.currency] || 0) + item.amount
    return totals
  }, {}), [opportunities])
  const usdPotential = totalsByCurrency.USD || 0
  const highValueCount = opportunities.filter((item) => item.priority === 'high').length
  const checkingOrder = checkingOrderStatus
    || Boolean(returnedOrderId && order?.order_id !== returnedOrderId && !orderError)

  useEffect(() => {
    if (!returnedOrderId) return undefined
    let active = true
    apiRequest(`/api/paypal/orders/${encodeURIComponent(returnedOrderId)}`)
      .then((orderDetails) => {
        if (active) {
          setOrder({ ...orderDetails, approval_url: null })
          setOrderError('')
        }
      })
      .catch((requestError) => {
        if (active) {
          setOrderError(
            requestError.message || 'Could not verify the PayPal Sandbox order.',
          )
        }
      })
    return () => {
      active = false
    }
  }, [returnedOrderId])

  async function createSandboxOrder(event) {
    event.preventDefault()
    setCreatingOrder(true)
    setOrderError('')
    setOrder(null)
    try {
      const createdOrder = await apiRequest('/api/paypal/orders', {
        method: 'POST',
        body: { amount, currency },
      })
      setOrder(createdOrder)
    } catch (requestError) {
      setOrderError(requestError.message || 'Could not create a PayPal Sandbox order.')
    } finally {
      setCreatingOrder(false)
    }
  }

  async function refreshSandboxOrder(orderId) {
    setCheckingOrderStatus(true)
    setOrderError('')
    try {
      const orderDetails = await apiRequest(
        `/api/paypal/orders/${encodeURIComponent(orderId)}`,
      )
      setOrder((currentOrder) => ({
        ...currentOrder,
        ...orderDetails,
        approval_url: currentOrder?.approval_url || null,
      }))
    } catch (requestError) {
      setOrderError(requestError.message || 'Could not refresh the PayPal order.')
    } finally {
      setCheckingOrderStatus(false)
    }
  }

  async function captureSandboxOrder(orderId) {
    setCapturingOrder(true)
    setOrderError('')
    try {
      const capture = await apiRequest(
        `/api/paypal/orders/${encodeURIComponent(orderId)}/capture`,
        { method: 'POST' },
      )
      setOrder((currentOrder) => ({
        ...currentOrder,
        ...capture,
        status: capture.order_status,
        capture_status: capture.capture_status,
        approval_url: null,
      }))
      if (returnedOrderId === orderId) {
        const nextParams = new URLSearchParams(searchParams)
        nextParams.delete('token')
        nextParams.delete('PayerID')
        setSearchParams(nextParams, { replace: true })
      }
    } catch (requestError) {
      setOrderError(requestError.message || 'Could not capture the PayPal order.')
    } finally {
      setCapturingOrder(false)
    }
  }

  return <>
    <PageHeader eyebrow="RECOVERY WORKSPACE" title="Recovery opportunities" description="Review demo opportunities and create a separate PayPal Sandbox checkout order." />
    {loading ? <LoadingState label="Loading recovery opportunities" /> : error ? <ErrorState error={error} onRetry={retry} /> : <div className="page-stack">
      <section className="panel panel-pad"><div className="panel-header"><div><h2>Create a Sandbox checkout</h2><p>Approve the order with a Sandbox buyer, then capture it here. This does not change demo transactions.</p></div><span className="sample-label">SANDBOX</span></div>
        <form className="table-toolbar" onSubmit={createSandboxOrder}>
          <div className="table-controls">
            <label className="field-control"><span>Amount</span><input aria-label="Sandbox order amount" inputMode="decimal" min="0.01" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
            <label className="field-control"><span>Currency</span><select aria-label="Sandbox order currency" value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></label>
            <button className="button button-primary" disabled={creatingOrder || !amount || Number(amount) <= 0} type="submit">{creatingOrder ? 'Creating order…' : 'Create Sandbox order'}<ArrowUpRight size={14} /></button>
          </div>
        </form>
        {orderError && <div className="auth-message auth-error" role="alert">{orderError}</div>}
        {checkingOrder && <div className="auth-message" role="status">Checking the order status with PayPal Sandbox…</div>}
        {order?.capture_status === 'COMPLETED' && <div className="auth-message auth-notice" role="status"><CircleCheck size={16} /> Payment captured: {formatCurrency(Number(order.amount), order.currency)}. Capture ID {order.capture_id}.</div>}
        {order && order.capture_status !== 'COMPLETED' && <div className="auth-message" role="status">
          Order {order.order_id} · {formatCurrency(Number(order.amount), order.currency)} · PayPal status: {order.status}
          {order.approval_url && <> · <a href={order.approval_url} rel="noreferrer" target="_blank">Approve with PayPal Sandbox</a></>}
          {order.status === 'APPROVED' && <button className="button button-primary" disabled={capturingOrder} onClick={() => captureSandboxOrder(order.order_id)} type="button">{capturingOrder ? 'Capturing payment…' : 'Capture approved payment'}</button>}
          {returnedOrderId === order.order_id && order.status !== 'APPROVED' && <><span> PayPal returned to PayLens; refresh to verify approval before capture.</span><button className="button button-secondary" disabled={checkingOrder} onClick={() => refreshSandboxOrder(order.order_id)} type="button">Refresh order status</button></>}
        </div>}
      </section>
      <section className="recovery-kpis"><article className="recovery-kpi"><span>Potentially recoverable revenue</span><strong>{formatCurrency(usdPotential)}</strong><small>USD demo opportunities only</small></article><article className="recovery-kpi"><span>Recovery opportunities</span><strong>{opportunities.length}</strong><small>Temporary sample records</small></article><article className="recovery-kpi"><span>High-value opportunities</span><strong>{highValueCount}</strong><small>Priority uses sample amount thresholds</small></article></section>
      <section className="panel panel-pad"><div className="panel-header"><div><h2>Opportunity queue</h2><p>Reasons are based on sample transaction status and failure details.</p></div><span className="sample-label">DEMO DATA</span></div>
        {opportunities.length ? <div className="table-scroll"><table className="data-table recovery-table"><thead><tr><th>Opportunity</th><th>Customer</th><th>Amount</th><th>Reason</th><th>Status</th><th>Priority</th><th>Identified</th><th>Action</th></tr></thead><tbody>{opportunities.map((item) => <tr key={item.opportunity_id}><td><span className="table-id">{item.opportunity_id}</span><small className="table-secondary">{item.transaction_id}</small></td><td>{item.customer_name}</td><td className="table-amount">{formatCurrency(item.amount, item.currency)}</td><td className="reason-cell">{item.reason}</td><td><span className="status-badge status-abandoned"><i />{item.status}</span></td><td><span className={`priority-badge${item.priority === 'standard' ? ' priority-standard' : ''}`}>{item.priority}</span></td><td>{formatDate(item.identified_at, { dateStyle: 'medium' })}</td><td><Link className="table-action" to={`/dashboard/investigator?transactionId=${encodeURIComponent(item.transaction_id)}`} aria-label={`Investigate ${item.transaction_id}`}><ArrowUpRight size={15} /></Link></td></tr>)}</tbody></table></div> : <p className="panel-body-copy">No demo opportunities are available.</p>}
      </section>
      <div className="demo-caption">Currency totals stay separate: {Object.entries(totalsByCurrency).map(([currency, amount]) => `${formatCurrency(amount, currency)} ${currency}`).join(' · ') || 'none'}.</div>
    </div>}
  </>
}