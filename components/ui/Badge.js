export default function Badge({ children, color='gray', className='' }) {
  const colors = {
    gray: 'pill-badge',
    brand: 'pill-badge !bg-brand/10 !text-brand !border-brand/30',
    green: 'pill-badge !bg-green-50 !text-green-700 !border-green-200',
    red: 'pill-badge !bg-red-50 !text-red-700 !border-red-200',
    yellow: 'pill-badge !bg-yellow-50 !text-yellow-700 !border-yellow-200'
  }
  return <span className={[colors[color] || colors.gray, className].join(' ')}>{children}</span>
}
