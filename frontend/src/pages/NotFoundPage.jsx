import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return <section className="panel not-found"><h2>Page not found</h2><p>This PayLens view does not exist.</p><Link className="button button-primary" to="/dashboard">Return to dashboard</Link></section>
}