import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge.jsx'
import { EmptyState } from './DataStates.jsx'
import { formatCurrency, formatDate } from '../utils/format.js'

export default function TransactionTable({ transactions, compact = false }) {
  if (!transactions.length) return <EmptyState title="No matching transactions" message="Try another search or status filter." />
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr><th>Transaction ID</th><th>Customer</th><th>Amount</th><th>Currency</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
        <tbody>{transactions.map((transaction) => <tr key={transaction.transaction_id}>
          <td><Link className="table-id" to={`/dashboard/transactions/${transaction.transaction_id}`}>{transaction.transaction_id}</Link>{!compact && <small className="table-secondary">{transaction.order_reference}</small>}</td>
          <td>{transaction.customer_name}</td><td className="table-amount">{formatCurrency(transaction.amount, transaction.currency)}</td><td>{transaction.currency}</td>
          <td><StatusBadge status={transaction.status} /></td><td>{formatDate(transaction.created_at, { dateStyle: 'medium' })}</td>
          <td><Link className="table-action" to={`/dashboard/transactions/${transaction.transaction_id}`} aria-label={`View ${transaction.transaction_id}`}><ArrowUpRight size={15} /></Link></td>
        </tr>)}</tbody>
      </table>
    </div>
  )
}