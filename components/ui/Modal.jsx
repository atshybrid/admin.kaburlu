/**
 * Modern Modal Component (MVP Pattern - View Layer)
 */

import { useEffect, useCallback } from 'react'
import { IconX } from './icons'

export default function Modal({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  /** 'auto' | 'visible' — visible helps dropdowns inside modal (no clip) */
  contentOverflow = 'auto',
}) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[calc(100vw-2rem)]'
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

  const contentScroll =
    contentOverflow === 'visible'
      ? 'overflow-visible'
      : 'overflow-y-auto overscroll-contain'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop — no blur (GPU-heavy, causes jank) */}
      <div
        className="fixed inset-0 bg-black/45 animate-in fade-in duration-150"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden
      />

      {/* Modal */}
      <div
        className={`
            relative z-10 w-full ${sizes[size] || sizes.md} max-h-[calc(100vh-2rem)]
            flex flex-col bg-white rounded-2xl shadow-2xl
            animate-in fade-in zoom-in-95 duration-200
            ${className}
          `}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
              <div>
                {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
                {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <IconX className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={`px-6 py-5 flex-1 min-h-0 ${contentScroll}`}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              {footer}
            </div>
          )}
      </div>
    </div>
  )
}
