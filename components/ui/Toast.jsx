/**
 * Modern Toast/Notification Component (MVP Pattern - View Layer)
 */

import { useEffect, useState } from 'react'
import { IconCheck, IconAlertCircle, IconX } from './icons'

const toastStore = {
  listeners: new Set(),
  toasts: [],
  notify(toast) {
    const id = Date.now() + Math.random()
    const newToast = { id, ...toast, visible: true }
    this.toasts = [...this.toasts, newToast]
    this.listeners.forEach(l => l(this.toasts))

    // Auto dismiss
    setTimeout(() => {
      this.dismiss(id)
    }, toast.duration || 4000)

    return id
  },
  dismiss(id) {
    this.toasts = this.toasts.map(t =>
      t.id === id ? { ...t, visible: false } : t
    )
    this.listeners.forEach(l => l(this.toasts))

    // Remove after animation
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id)
      this.listeners.forEach(l => l(this.toasts))
    }, 300)
  },
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

// Toast API
export const toast = {
  success(message, options = {}) {
    return toastStore.notify({ type: 'success', message, ...options })
  },
  error(message, options = {}) {
    return toastStore.notify({ type: 'error', message, ...options })
  },
  warning(message, options = {}) {
    return toastStore.notify({ type: 'warning', message, ...options })
  },
  info(message, options = {}) {
    return toastStore.notify({ type: 'info', message, ...options })
  },
  dismiss(id) {
    toastStore.dismiss(id)
  }
}

// Toast container component
export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    return toastStore.subscribe(setToasts)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onDismiss={() => toast.dismiss(t.id)} />
      ))}
    </div>
  )
}

function Toast({ type, message, title, visible, onDismiss }) {
  const types = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200',
      icon: <IconCheck className="w-5 h-5 text-emerald-600" />,
      text: 'text-emerald-800'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: <IconAlertCircle className="w-5 h-5 text-red-600" />,
      text: 'text-red-800'
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      icon: <IconAlertCircle className="w-5 h-5 text-amber-600" />,
      text: 'text-amber-800'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <IconAlertCircle className="w-5 h-5 text-blue-600" />,
      text: 'text-blue-800'
    }
  }

  const config = types[type] || types.info

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        transition-all duration-300
        ${config.bg}
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex-shrink-0">
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && <p className={`font-medium ${config.text}`}>{title}</p>}
        <p className={`text-sm ${config.text} ${title ? 'mt-0.5' : ''}`}>{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
      >
        <IconX className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  )
}
