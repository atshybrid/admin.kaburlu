/**
 * Modern Dropdown Menu Component (MVP Pattern - View Layer)
 */

import { useState, useRef, useEffect } from 'react'
import { IconMoreVertical, IconChevronDown } from './icons'

export default function Dropdown({
  trigger,
  children,
  align = 'right',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const alignments = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2'
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <IconMoreVertical className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 min-w-[180px]
            bg-white rounded-lg border border-gray-200 shadow-lg
            py-1 overflow-hidden
            ${alignments[align] || alignments.right}
          `}
        >
          {typeof children === 'function' ? children({ close: () => setIsOpen(false) }) : children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({
  children,
  icon,
  danger = false,
  disabled = false,
  onClick,
  className = ''
}) {
  return (
    <button
      onClick={(e) => {
        if (!disabled && onClick) {
          onClick(e)
        }
      }}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left
        transition-colors
        ${danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-700 hover:bg-gray-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0 w-4 h-4">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-gray-100" />
}

// Select-style dropdown
export function DropdownSelect({
  value,
  options = [],
  onChange,
  placeholder = 'Select...',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.value === value)

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <IconChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg py-1 max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`
                w-full flex items-center px-4 py-2.5 text-sm text-left
                transition-colors
                ${option.value === value
                  ? 'bg-brand/5 text-brand'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
