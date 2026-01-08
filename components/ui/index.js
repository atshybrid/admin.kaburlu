/**
 * UI Components Index (MVP Pattern - View Layer)
 * Central export for all UI components
 */

// Core Components
export { default as Badge, StatusBadge } from './Badge.jsx'
export { default as Button, IconButton } from './Button.jsx'
export { default as Card, CardRow, CardGrid } from './Card.jsx'
export { default as ConfirmDialog } from './ConfirmDialog.jsx'
export { default as DataTable } from './DataTable'
export { default as Dropdown, DropdownItem, DropdownDivider, DropdownSelect } from './Dropdown.jsx'
export { default as EmptyState } from './EmptyState.jsx'
export { default as Modal } from './Modal.jsx'
export { default as Pagination } from './Pagination.jsx'
export { default as SlidePanel } from './SlidePanel.jsx'
export { default as Spinner } from './Spinner.jsx'
export { default as StatCard, StatInline } from './StatCard.jsx'
export { default as Tabs, TabList } from './Tabs.jsx'
export { toast, ToastContainer } from './Toast.jsx'

// Form Components
export { 
  FormField, 
  Input, 
  Select, 
  Textarea, 
  Checkbox, 
  Switch 
} from './Form.jsx'

// Icons
export * from './Icons'
