export function formatLastPost(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const now = Date.now()
  const days = Math.floor((now - d.getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function engagementBadgeClass(tier) {
  const map = {
    A: 'bg-emerald-100 text-emerald-800',
    B: 'bg-sky-100 text-sky-800',
    C: 'bg-amber-100 text-amber-800',
    D: 'bg-slate-200 text-slate-600',
  }
  return map[tier] || map.D
}