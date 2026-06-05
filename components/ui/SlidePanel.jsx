/**
 * Modern Slide Panel Component (MVP Pattern - View Layer)
 * Right-side sliding drawer for details/forms
 */

import { useEffect, useCallback } from 'react'
import { IconX } from './icons'
import Spinner from './Spinner'

export default function SlidePanel({
  isOpen: isOpenProp,
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  loading = false,
  width = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  className = ''
}) {
  const isOpen = Boolean(isOpenProp ?? open)

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[50vw]'
  }

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose?.()
    }
  }, [closeOnEscape, onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 transition-opacity"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 flex max-w-full">
        <div
          className={`
            w-screen ${widths[width] || widths.md}
            bg-white shadow-2xl
            transform transition-transform duration-300 ease-out
            ${className}
          `}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
            <div>
              {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 h-[calc(100vh-60px-72px)]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Spinner size="lg" />
                <p className="mt-3 text-sm text-gray-500">Loading...</p>
              </div>
            ) : (
              children
            )}
          </div>

          {/* Footer */}
          {footer && (
            <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
