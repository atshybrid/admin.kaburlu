import { APPROVAL_STATUS_LABELS } from '../../../lib/readers/normalize'

const STYLES = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800 ring-amber-200',
  REJECTED: 'bg-rose-100 text-rose-800 ring-rose-200',
  SUSPENDED: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export default function ApprovalStatusBadge({ status }) {
  const key = status || 'ACTIVE'
  const text = APPROVAL_STATUS_LABELS[key] || key
  const style = STYLES[key] || STYLES.SUSPENDED
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 ${style}`}>
      {text}
    </span>
  )
}
