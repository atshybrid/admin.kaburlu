/**
 * UI Primitives - Reusable design system components
 * Provides consistent styling across the admin dashboard
 */

import { useState, useEffect, createContext, useContext } from 'react'

// ============ DESIGN TOKENS ============
export const tokens = {
  colors: {
    brand: 'var(--ui-brand)',
    brandAccent: 'var(--ui-brand-accent)',
    brandSoft: 'var(--ui-brand-soft)',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '20px',
  }
}

// ============ CARD ============
export function Card({ children, className = '', padding = 'md', hover = false, ...props }) {
  const paddings = { none: '', sm: 'p-3', md: 'p-4 md:p-5', lg: 'p-5 md:p-6' }
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-sm ${paddings[padding]} ${hover ? 'transition-all duration-200 hover:shadow-md hover:border-slate-300' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, actions, badge, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-slate-900 truncate">{title}</h3>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

// ============ BUTTONS ============
const btnBase = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

const btnVariants = {
  primary: 'bg-brand text-white border border-brand hover:bg-brand-dark hover:border-brand-dark shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
  ghost: 'bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-red-600 text-white border border-red-600 hover:bg-red-700 shadow-sm',
  dangerOutline: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300',
  success: 'bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700 shadow-sm',
}

const btnSizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export function Button({ children, variant = 'secondary', size = 'md', icon, iconRight, loading, className = '', ...props }) {
  return (
    <button
      className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner size={16} /> : icon}
      {children}
      {iconRight}
    </button>
  )
}

// ============ INPUTS ============
export function Input({ label, error, hint, className = '', inputClassName = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <input
        className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none ${error ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'} ${inputClassName}`}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Select({ label, error, hint, options = [], className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <select
        className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 transition-all duration-200 hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none ${error ? 'border-red-300' : 'border-slate-200'}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, hint, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <textarea
        className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none resize-y min-h-[80px] ${error ? 'border-red-300' : 'border-slate-200'}`}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Toggle({ label, checked, onChange, disabled, className = '' }) {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange?.(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-2 ${checked ? 'bg-brand' : 'bg-slate-200'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  )
}

// ============ BADGES ============
const badgeVariants = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  primary: 'bg-brand-50 text-brand border-brand/20',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
}

export function Badge({ children, variant = 'default', dot, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${badgeVariants[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'success' ? 'bg-emerald-500' : variant === 'warning' ? 'bg-amber-500' : variant === 'danger' ? 'bg-red-500' : 'bg-slate-400'}`} />}
      {children}
    </span>
  )
}

// ============ SPINNER ============
export function Spinner({ size = 20, className = '' }) {
  return (
    <svg
      className={`animate-spin text-current ${className}`}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ============ EMPTY STATE ============
export function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {icon && <div className="mb-4 text-slate-300">{icon}</div>}
      <h3 className="text-base font-medium text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ============ LOADING STATE ============
export function LoadingState({ label = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Spinner size={32} className="text-brand mb-3" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}

// ============ ERROR STATE ============
export function ErrorState({ message, onRetry, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-sm text-slate-700 mb-3">{message || 'Something went wrong'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

// ============ DRAWER ============
export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-lg' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full ${width} bg-white shadow-xl flex flex-col animate-slide-in-right`}>
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 truncate">{title}</div>
            {subtitle && <div className="text-xs text-slate-500 truncate">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && (
          <div className="border-t border-slate-200 p-4 shrink-0 bg-slate-50">{footer}</div>
        )}
      </div>
    </div>
  )
}

// ============ MODAL ============
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' }
  
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white rounded-xl shadow-xl animate-scale-in`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="border-t border-slate-200 px-5 py-4 bg-slate-50 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  )
}

// ============ TOAST CONTEXT ============
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }

  const toast = {
    info: (msg) => addToast(msg, 'info'),
    success: (msg) => addToast(msg, 'success'),
    warning: (msg) => addToast(msg, 'warning'),
    error: (msg) => addToast(msg, 'error'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-in-up ${
              t.type === 'success' ? 'bg-emerald-600 text-white' :
              t.type === 'error' ? 'bg-red-600 text-white' :
              t.type === 'warning' ? 'bg-amber-500 text-white' :
              'bg-slate-800 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    return { info: () => {}, success: () => {}, warning: () => {}, error: () => {} }
  }
  return context
}

// ============ DATA TABLE ============
export function DataTable({ columns, data, loading, error, onRetry, emptyTitle, emptyDescription, onRowClick, className = '' }) {
  if (loading) {
    return <LoadingState className={className} />
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} className={className} />
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || 'No data found'}
        description={emptyDescription}
        className={className}
      />
    )
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead className="bg-slate-50/80 sticky top-0">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 ${col.className || ''}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              className={`border-b border-slate-100 last:border-b-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} className={`px-4 py-3.5 text-slate-700 ${col.cellClassName || ''}`}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============ SEARCH INPUT ============
export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
      />
    </div>
  )
}

// ============ PAGINATION ============
export function Pagination({ page, totalPages, onPageChange, className = '' }) {
  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-sm text-slate-500">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

// ============ STAT CARD ============
export function StatCard({ title, value, change, changeType = 'neutral', icon, description }) {
  const changeColors = {
    positive: 'text-emerald-600 bg-emerald-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-slate-600 bg-slate-100',
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand">
            {icon}
          </div>
        )}
      </div>
      {change && (
        <div className="mt-3 flex items-center gap-1">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${changeColors[changeType]}`}>
            {change}
          </span>
          <span className="text-xs text-slate-400">vs last period</span>
        </div>
      )}
    </Card>
  )
}

// ============ TAB GROUP ============
export function TabGroup({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1 p-1 bg-slate-100 rounded-lg ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === tab.key
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ============ DROPDOWN ============
export function Dropdown({ trigger, items, align = 'right' }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute z-50 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 ${align === 'right' ? 'right-0' : 'left-0'}`}>
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => { item.onClick?.(); setOpen(false) }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${item.danger ? 'text-red-600' : 'text-slate-700'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
