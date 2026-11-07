export function istMonthBounds(date = new Date()) {
  const y = date.toLocaleString('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric' })
  const m = date.toLocaleString('en-CA', { timeZone: 'Asia/Kolkata', month: '2-digit' })
  const year = Number(y)
  const month = Number(m)
  const lastDay = new Date(year, month, 0).getDate()
  const mm = String(month).padStart(2, '0')
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function minorToInr(minor) {
  const n = Number(minor)
  if (!Number.isFinite(n)) return '—'
  return `₹${(n / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function rupeesLabel(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}
