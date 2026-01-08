/**
 * Modern Form Components (MVP Pattern - View Layer)
 */

import { forwardRef } from 'react'

// Form Field Wrapper
export function FormField({ label, error, hint, required, className = '', children }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

// Text Input
export const Input = forwardRef(function Input({
  type = 'text',
  size = 'md',
  error = false,
  className = '',
  leftIcon = null,
  rightIcon = null,
  ...props
}, ref) {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const baseClasses = `
    w-full rounded-lg border bg-white
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    placeholder:text-gray-400
    ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'}
    ${sizes[size] || sizes.md}
  `

  if (leftIcon || rightIcon) {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`${baseClasses} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }

  return (
    <input
      ref={ref}
      type={type}
      className={`${baseClasses} ${className}`}
      {...props}
    />
  )
})

// Select
export const Select = forwardRef(function Select({
  size = 'md',
  error = false,
  className = '',
  children,
  placeholder,
  ...props
}, ref) {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  return (
    <select
      ref={ref}
      className={`
        w-full rounded-lg border bg-white appearance-none
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand
        disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
        ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'}
        ${sizes[size] || sizes.md}
        ${className}
        bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]
        bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10
      `}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  )
})

// Textarea
export const Textarea = forwardRef(function Textarea({
  size = 'md',
  error = false,
  className = '',
  rows = 4,
  ...props
}, ref) {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`
        w-full rounded-lg border bg-white resize-none
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand
        disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
        placeholder:text-gray-400
        ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    />
  )
})

// Checkbox
export const Checkbox = forwardRef(function Checkbox({
  label,
  description,
  className = '',
  ...props
}, ref) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        className="mt-1 w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand/20 transition-colors"
        {...props}
      />
      <div>
        {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </label>
  )
})

// Switch/Toggle
export const Switch = forwardRef(function Switch({
  label,
  description,
  checked = false,
  onChange,
  className = '',
  ...props
}, ref) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange?.(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:ring-offset-2
          ${checked ? 'bg-brand' : 'bg-gray-200'}
        `}
        {...props}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-sm
            transition-transform duration-200
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      <div>
        {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </label>
  )
})
