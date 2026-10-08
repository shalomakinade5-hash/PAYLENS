import { AlertTriangle, LoaderCircle, RefreshCw } from 'lucide-react'

export function LoadingState({ label = 'Loading demo data' }) {
  return <div className="data-state" role="status"><LoaderCircle className="loading-icon" size={20} /><span>{label}</span></div>
}

export function ErrorState({ error, onRetry, title = 'Could not load this view' }) {
  return <div className="data-state error-state" role="alert"><span className="state-icon error"><AlertTriangle size={17} /></span><div><strong>{title}</strong><p>{error?.message || 'The request failed. Please try again.'}</p></div>{onRetry && <button className="button button-secondary" type="button" onClick={onRetry}><RefreshCw size={14} />Retry</button>}</div>
}

export function EmptyState({ title, message }) {
  return <div className="empty-state"><span className="empty-state-mark">0</span><strong>{title}</strong><p>{message}</p></div>
}