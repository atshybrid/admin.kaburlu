/** Client-side member search (queue API often ignores ?q=) */

export function matchesMemberSearch(row, q) {
  const term = String(q || '').trim().toLowerCase()
  if (!term) return true

  const fields = [
    row?.fullName,
    row?.user?.profile?.fullName,
    row?.mobileNumber,
    row?.user?.mobileNumber,
    row?.pressId,
    row?.currentNewspaper,
    row?.organization,
    row?.unionName,
    row?.state,
    row?.district,
    row?.mandal,
    row?.designation,
    row?.currentDesignation,
  ]
  const text = fields.filter(Boolean).join(' ').toLowerCase()
  if (text.includes(term)) return true

  const digits = term.replace(/\D/g, '')
  if (digits.length >= 3) {
    const mobile = String(row?.mobileNumber || row?.user?.mobileNumber || '').replace(/\D/g, '')
    if (mobile.includes(digits)) return true
  }

  return false
}

export function filterMembersBySearch(items, q) {
  const list = Array.isArray(items) ? items : []
  if (!String(q || '').trim()) return list
  return list.filter((r) => matchesMemberSearch(r, q))
}
