export default function Button({ variant='default', children, className='', disabled=false, ...rest }) {
  const base = 'btn-base'
  const variants = {
    default: '',
    brand: 'btn-brand',
    outline: 'btn-outline-brand',
    danger: 'btn-danger'
  }
  const cls = [base, variants[variant] || '', disabled ? 'btn-disabled' : '', className].filter(Boolean).join(' ')
  return (
    <button className={cls} disabled={disabled} {...rest}>{children}</button>
  )
}
