/**
 * Debounced async autocomplete — supports manual text when nothing matches.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { FormField, Input } from '../../ui'

export default function AsyncSearchField({
  label,
  hint,
  placeholder,
  value,
  onChange,
  onSelect,
  searchFn,
  formatOption,
  required,
  disabled,
  emptyHint,
  minChars = 2,
  className,
}) {
  const [q, setQ] = useState(value || '')
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    setQ(value || '')
  }, [value])

  const runSearch = useCallback(
    (term) => {
      clearTimeout(timerRef.current)
      if (!term || term.length < minChars) {
        setItems([])
        setSearched(false)
        return
      }
      timerRef.current = setTimeout(async () => {
        setLoading(true)
        try {
          const res = await searchFn(term)
          setItems(res?.items || [])
          setSearched(true)
          setOpen(true)
        } catch {
          setItems([])
          setSearched(true)
        } finally {
          setLoading(false)
        }
      }, 320)
    },
    [searchFn, minChars]
  )

  return (
    <FormField label={label} hint={hint} required={required} className={className}>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={q}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value
            setQ(v)
            onChange(v)
            runSearch(v)
          }}
          onFocus={() => (items.length > 0 || searched) && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
        />
        {loading ? (
          <span className="absolute right-2 top-2 text-xs text-gray-400">…</span>
        ) : null}
        {open && items.length > 0 ? (
          <ul className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg text-sm">
            {items.map((item, idx) => (
              <li key={item.id || item.registrationNumber || idx}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-gray-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const labelText = formatOption(item)
                    setQ(labelText)
                    onChange(labelText)
                    onSelect?.(item)
                    setOpen(false)
                  }}
                >
                  {formatOption(item)}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {open && searched && !loading && q.trim().length >= minChars && items.length === 0 ? (
          <p className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 shadow">
            {emptyHint || `No matches for "${q.trim()}" — you can keep typing to use your own text.`}
          </p>
        ) : null}
      </div>
    </FormField>
  )
}
