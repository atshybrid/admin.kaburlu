/**
 * Search approved union members by name / mobile / press ID
 * (no raw profile ID typing in forms)
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import {
  memberName,
  memberMobile,
  pressIdDisplay,
  memberLocation,
} from '../../../lib/journalist/memberDisplay'
import { DEFAULT_UNION_NAME } from '../../../lib/journalist/unionConfig'
import { useUnionSettings } from './useUnionSettings'
import { FormField, Input } from '../../ui'

function formatMember(row) {
  const parts = [memberName(row), memberMobile(row)]
  const press = pressIdDisplay(row)
  if (press) parts.push(press)
  const loc = memberLocation(row)
  if (loc && loc !== '—') parts.push(loc)
  return parts.filter(Boolean).join(' · ')
}

export function MemberSearchSelect({
  label = 'Search member',
  hint,
  placeholder = 'Name, mobile, press ID…',
  required,
  unionName: unionProp,
  onSelect,
  value,
}) {
  const { unionName } = useUnionSettings()
  const resolvedUnion = unionProp || unionName || DEFAULT_UNION_NAME

  const [q, setQ] = useState(value || '')
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    setQ(value || '')
  }, [value])

  const runSearch = useCallback(
    (term) => {
      clearTimeout(timerRef.current)
      if (!term || term.length < 2) {
        setItems([])
        return
      }
      timerRef.current = setTimeout(async () => {
        setLoading(true)
        try {
          const raw = await journalistApi.listMembers({
            q: term,
            unionName: resolvedUnion,
            membershipStatus: 'APPROVED',
            page: 1,
            limit: 15,
          })
          const list = raw?.items ?? (Array.isArray(raw) ? raw : [])
          setItems(list)
          setOpen(true)
        } catch {
          setItems([])
        } finally {
          setLoading(false)
        }
      }, 320)
    },
    [resolvedUnion]
  )

  return (
    <FormField label={label} hint={hint} required={required}>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            const v = e.target.value
            setQ(v)
            runSearch(v)
          }}
          onFocus={() => items.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
        />
        {loading ? (
          <span className="absolute right-2 top-2 text-xs text-gray-400">…</span>
        ) : null}
        {open && items.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg text-sm">
            {items.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-gray-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setQ(formatMember(row))
                    onSelect?.(row)
                    setOpen(false)
                  }}
                >
                  {formatMember(row)}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </FormField>
  )
}

export function MemberWinnerPicker({ winners = [], onChange, maxSeats = 1, unionName }) {
  const [searchLabel, setSearchLabel] = useState('')

  const addWinner = (row) => {
    if (!row?.id) return
    if (winners.some((w) => w.id === row.id)) return
    if (winners.length >= maxSeats) return
    onChange?.([...winners, row])
    setSearchLabel('')
  }

  const removeWinner = (id) => {
    onChange?.(winners.filter((w) => w.id !== id))
  }

  return (
    <div className="space-y-3">
      {winners.length > 0 ? (
        <ul className="space-y-2">
          {winners.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            >
              <span>{formatMember(w)}</span>
              <button
                type="button"
                className="text-red-600 text-xs font-medium hover:underline"
                onClick={() => removeWinner(w.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {winners.length < maxSeats ? (
        <MemberSearchSelect
          label={`Add winner (${winners.length}/${maxSeats})`}
          hint="Search approved members — no ID typing"
          unionName={unionName}
          value={searchLabel}
          onSelect={addWinner}
        />
      ) : (
        <p className="text-xs text-gray-500">Maximum {maxSeats} winner(s) selected.</p>
      )}
    </div>
  )
}
