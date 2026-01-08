/**
 * Modern Button Component (MVP Pattern - View Layer)
 */

import Spinner from './Spinner'

export default function Button({
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon = null,
  rightIcon = null,
  fullWidth = false,
  type = 'button',
  className = '',
  ...props
}) {
  const variants = {
    default: 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
    primary: 'bg-brand border-brand text-white hover:bg-brand-dark shadow-sm',
    secondary: 'bg-gray-100 border-gray-100 text-gray-700 hover:bg-gray-200',
    success: 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    danger: 'bg-red-600 border-red-600 text-white hover:bg-red-700 shadow-sm',
    warning: 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600 shadow-sm',
    ghost: 'bg-transparent border-transparent text-gray-600 hover:bg-gray-100',
    outline: 'bg-transparent border-brand text-brand hover:bg-brand/5',
    'outline-danger': 'bg-transparent border-red-300 text-red-600 hover:bg-red-50',
  }

  const sizes = {
    xs: 'text-xs px-2 py-1 gap-1',
    sm: 'text-sm px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2',
    xl: 'text-base px-6 py-3 gap-2.5'
  }

  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg border
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-brand/20 focus:ring-offset-1
        disabled:opacity-60 disabled:cursor-not-allowed
        ${variants[variant] || variants.default}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" className="mr-1" />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !loading && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  )
}

// Icon button variant
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  return (
    <Button
      variant={variant}
      className={`!p-0 ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {icon}
    </Button>
  )
}
