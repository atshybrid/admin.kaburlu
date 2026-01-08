/**
 * Modern Card Component (MVP Pattern - View Layer)
 */

export default function Card({
  children,
  title,
  subtitle,
  actions,
  padding = 'default',
  className = ''
}) {
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-5',
    lg: 'p-6'
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={paddings[padding] || paddings.default}>
        {children}
      </div>
    </div>
  )
}

// Detail row for card content
export function CardRow({ label, value, className = '' }) {
  return (
    <div className={`py-2.5 border-b border-gray-100 last:border-0 ${className}`}>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )
}

// Grid layout for details
export function CardGrid({ children, cols = 2, className = '' }) {
  return (
    <dl className={`grid grid-cols-1 sm:grid-cols-${cols} gap-4 ${className}`}>
      {children}
    </dl>
  )
}
