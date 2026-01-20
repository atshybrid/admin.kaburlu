/**
 * Modern Stat Card Component (MVP Pattern - View Layer)
 */

import { IconTrendingUp, IconTrendingDown } from './icons'

export default function StatCard({
  title,
  value,
  delta,
  description,
  icon,
  trend = 'neutral',
  className = ''
}) {
  const isPositive = trend === 'up' || (delta && delta.startsWith('+'))
  const isNegative = trend === 'down' || (delta && delta.startsWith('-'))

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {delta && (
              <span
                className={`
                  inline-flex items-center text-xs font-semibold
                  ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-gray-500'}
                `}
              >
                {isPositive ? (
                  <IconTrendingUp className="w-3 h-3 mr-0.5" />
                ) : isNegative ? (
                  <IconTrendingDown className="w-3 h-3 mr-0.5" />
                ) : null}
                {delta}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs text-gray-400">{description}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

// Compact stat for inline displays
export function StatInline({ label, value, className = '' }) {
  return (
    <div className={`flex items-center justify-between py-2 ${className}`}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )
}
