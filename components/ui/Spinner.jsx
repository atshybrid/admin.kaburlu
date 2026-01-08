/**
 * Modern Spinner Component (MVP Pattern - View Layer)
 */

export default function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-2',
    xl: 'w-14 h-14 border-[3px]'
  }

  return (
    <div
      className={`
        ${sizes[size] || sizes.md}
        rounded-full border-gray-200 border-t-brand animate-spin
        ${className}
      `}
    />
  )
}
