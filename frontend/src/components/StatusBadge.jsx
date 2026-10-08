import { titleCase } from '../utils/format.js'

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}><i />{titleCase(status)}</span>
}