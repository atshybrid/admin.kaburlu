/**
 * Modern Badge Component (MVP Pattern - View Layer)
 */

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = ''
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    primary: 'bg-brand/10 text-brand border-brand/20',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    secondary: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  }

  const dotColors = {
    default: 'bg-gray-400',
    primary: 'bg-brand',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    purple: 'bg-purple-500',
    secondary: 'bg-slate-400',
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border
        ${variants[variant] || variants.default}
        ${sizes[size] || sizes.sm}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`} />
      )}
      {children}
    </span>
  )
}

// Status badge helper for common statuses
export function StatusBadge({ status, className = '' }) {
  const statusMap = {
    // Generic statuses
    active: { variant: 'success', label: 'Active', dot: true },
    inactive: { variant: 'secondary', label: 'Inactive', dot: true },
    pending: { variant: 'warning', label: 'Pending', dot: true },
    verified: { variant: 'success', label: 'Verified', dot: true },
    unverified: { variant: 'danger', label: 'Unverified', dot: true },
    draft: { variant: 'secondary', label: 'Draft', dot: true },
    published: { variant: 'success', label: 'Published', dot: true },
    review: { variant: 'warning', label: 'Review', dot: true },
    rejected: { variant: 'danger', label: 'Rejected', dot: true },
    approved: { variant: 'success', label: 'Approved', dot: true },
    suspended: { variant: 'danger', label: 'Suspended', dot: true },
    archived: { variant: 'secondary', label: 'Archived', dot: true },
  }

  const normalized = (status || '').toLowerCase().replace(/[^a-z]/g, '')
  const config = statusMap[normalized] || { variant: 'default', label: status || 'Unknown', dot: false }

  return (
    <Badge variant={config.variant} dot={config.dot} className={className}>
      {config.label}
    </Badge>
  )
}
