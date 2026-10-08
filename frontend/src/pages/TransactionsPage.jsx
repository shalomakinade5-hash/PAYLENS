import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useApiData } from '../api/useApiData.js'
import { ErrorState, LoadingState } from '../components/DataStates.jsx'
import PageHeader from '../components/PageHeader.jsx'
import TransactionTable from '../components/TransactionTable.jsx'

const EMPTY_TRANSACTIONS = []

export default function TransactionsPage() {
  const { data, error, loading, retry } = useApiData('/api/transactions')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const transactions = data ?? EMPTY_TRANSACTIONS
  const filtered = useMemo(() => transactions.filter((transaction) => {
    const searchText = `${transaction.transaction_id} ${transaction.order_reference} ${transaction.customer_name}`.toLowerCase()
    return (!search || searchText.includes(search.toLowerCase())) && (status === 'all' || transaction.status === status)
  }), [transactions, search, status])

  return <>
    <PageHeader eyebrow="PAYMENT RECORDS" title="Transactions" description="Search and inspect the temporary PayLens transaction dataset." />
    {loading ? <LoadingState label="Loading transactions" /> : error ? <ErrorState error={error} onRetry={retry} /> : <section className="panel panel-pad table-panel">
      <div className="table-toolbar"><div><div className="panel-title-row"><h2>All transactions</h2><span className="sample-label">DEMO</span></div><p className="panel-subtitle">Transaction records are illustrative and do not come from PayPal.</p></div><span className="results-count">{filtered.length} results</span></div>
      <div className="table-toolbar"><div className="table-controls"><label className="field-control search-control"><Search size={14} /><input aria-label="Search transactions" placeholder="Search ID, order, or customer" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="field-control"><span className="sr-only">Filter by status</span><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="succeeded">Succeeded</option><option value="failed">Failed</option><option value="abandoned">Abandoned</option><option value="pending">Pending</option></select></label></div></div>
      <TransactionTable transactions={filtered} />
    </section>}
  </>
}