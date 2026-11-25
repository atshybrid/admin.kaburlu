export default function NewsDeskPageShell({ children, className = '', maxWidth = 'max-w-7xl' }) {
  return <div className={`${maxWidth} mx-auto space-y-5 pb-12 ${className}`.trim()}>{children}</div>
}