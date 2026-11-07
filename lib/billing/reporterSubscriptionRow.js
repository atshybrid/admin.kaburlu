/** Normalize platform billing reporter-subscription API rows */

function csvCell(value) {
  if (value == null) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function reporterDisplayName(row) {
  return row?.fullName || row?.name || row?.user?.profile?.fullName || '—'
}

export function reporterMobile(row) {
  return (
    row?.mobile ||
    row?.mobileNumber ||
    row?.user?.mobileNumber ||
    row?.user?.phone ||
    ''
  )
}

export function outstandingMonthsList(row) {
  const raw = row?.outstandingMonths
  if (!Array.isArray(raw) || !raw.length) return []
  return raw.map((o) => {
    if (o?.year != null && o?.month != null) {
      const type = o.type ? ` (${o.type})` : ''
      return `${o.year}-${String(o.month).padStart(2, '0')}${type}`
    }
    if (o?.label) return String(o.label)
    return o?.type ? String(o.type) : ''
  }).filter(Boolean)
}

export function monthsDueCount(row) {
  const list = row?.outstandingMonths
  if (Array.isArray(list) && list.length) return list.length
  const n = Number(row?.outstandingMonthsCount ?? row?.monthsDue)
  return Number.isFinite(n) ? n : 0
}

export function reporterDueRupees(row) {
  const n = Number(row?.dueAmountRupees)
  return Number.isFinite(n) ? n : ''
}

export function reporterTotalPayable(row) {
  return row?.feeBreakdown?.totalAmount ?? row?.feeBreakdown?.total ?? ''
}

export function downloadReporterSubscriptionsCsv(rows, meta = {}) {
  const { tenantSlug, bucket, from, to } = meta
  const header = [
    'Reporter Name',
    'Mobile',
    'Bucket',
    'Months Due (count)',
    'Outstanding Months',
    'Due Amount (INR)',
    'Monthly Base (INR)',
    'Total Payable (INR)',
  ]
  const lines = [header.join(',')]
  rows.forEach((row) => {
    const months = outstandingMonthsList(row)
    lines.push(
      [
        csvCell(reporterDisplayName(row)),
        csvCell(reporterMobile(row)),
        csvCell(row.bucket || ''),
        csvCell(monthsDueCount(row)),
        csvCell(months.join('; ')),
        csvCell(reporterDueRupees(row)),
        csvCell(row.monthlySubscriptionAmountRupees ?? ''),
        csvCell(reporterTotalPayable(row)),
      ].join(','),
    )
  })
  const slug = (tenantSlug || 'tenant').replace(/[^\w-]+/g, '_')
  const filename = `reporters-${slug}-${bucket || 'all'}-${from || 'na'}-${to || 'na'}.csv`
  const blob = new Blob(['\uFEFF', lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
