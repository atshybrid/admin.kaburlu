/**
 * Confirm Dialog Component (MVP Pattern - View Layer)
 */

import Modal from './Modal'
import Button from './Button.jsx'
import { IconAlertCircle, IconTrash } from './Icons'

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}) {
  const icons = {
    danger: <IconTrash className="w-6 h-6 text-red-600" />,
    warning: <IconAlertCircle className="w-6 h-6 text-amber-600" />,
    info: <IconAlertCircle className="w-6 h-6 text-blue-600" />
  }

  const iconBgs = {
    danger: 'bg-red-100',
    warning: 'bg-amber-100',
    info: 'bg-blue-100'
  }

  const buttonVariants = {
    danger: 'danger',
    warning: 'warning',
    info: 'primary'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center">
        <div className={`w-14 h-14 mx-auto rounded-full ${iconBgs[variant] || iconBgs.danger} flex items-center justify-center mb-4`}>
          {icons[variant] || icons.danger}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
      <div className="flex items-center justify-center gap-3 mt-6">
        <Button variant="default" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={buttonVariants[variant] || 'danger'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
