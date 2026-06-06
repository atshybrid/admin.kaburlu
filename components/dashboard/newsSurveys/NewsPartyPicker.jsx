/**
 * Party picker for News Surveys — GET /political-parties?q=&limit=
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react'
import { politicalPartiesApi } from '../../../lib/api/services/politicalPartiesApi'
import { normalizeParty, partyOptionLabel } from '../../../lib/politicalParties/normalize'
import PartyChip from '../politicalParties/PartyChip'
import { Input, Spinner } from '../../ui'

function NewsPartyPicker({ value = '', onChange, disabled = false }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedParty, setSelectedParty] = useState(null)
  const wrapRef = useRef(null)

  const loadParties = useCallback(async (q) => {
    setLoading(true)
    try {
      const raw = await politicalPartiesApi.searchPublic({
        limit: '100',
        ...(q?.trim() ? { q: q.trim() } : {}),
      })
      const list = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : raw?.data?.items || []
      setParties(list.map(normalizeParty).filter(Boolean))
    } catch {
      setParties([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => loadParties(search), search.trim() ? 300 : 0)
    return () => clearTimeout(t)
  }, [open, search, loadParties])

  useEffect(() => {
    if (!value) {
      setSelectedParty(null)
      return
    }
    const found = parties.find((p) => p.id === value)
    if (found) {
      setSelectedParty(found)
      return
    }
    let cancelled = false
    politicalPartiesApi
      .getAdmin(value)
      .then((raw) => {
        if (!cancelled) setSelectedParty(normalizeParty(raw))
      })
      .catch(() => {
        politicalPartiesApi
          .searchPublic({ limit: '1', q: value })
          .then((raw) => {
            const list = raw?.items || []
            if (!cancelled && list[0]) setSelectedParty(normalizeParty(list[0]))
          })
          .catch(() => {})
      })
    return () => {
      cancelled = true
    }
  }, [value, parties])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const pick = (party) => {
    setSelectedParty(party)
    onChange?.(party)
    setOpen(false)
    setSearch('')
  }

  const selected = selectedParty || parties.find((p) => p.id === value)

  return (
    <div ref={wrapRef} className="relative">
      {selected && !open ? (
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <PartyChip party={selected} size="sm" />
          <button
            type="button"
            className="text-xs text-brand font-medium hover:underline"
            onClick={() => setOpen(true)}
            disabled={disabled}
          >
            Change party
          </button>
        </div>
      ) : null}

      <Input
        placeholder="Search party — BJP, Congress, BRS…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        disabled={disabled}
      />
      <p className="text-xs text-gray-500 mt-1">Uses political parties catalog · required for survey branding</p>

      {open ? (
        <div className="absolute z-[90] mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : parties.length === 0 ? (
            <p className="text-sm text-gray-500 px-4 py-5 text-center">No parties found — try BJP or INC</p>
          ) : (
            <ul>
              {parties.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-brand/5 border-b border-gray-50 last:border-0 flex items-center gap-2 ${
                      value === p.id ? 'bg-brand/10 font-medium' : 'text-gray-900'
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(p)}
                  >
                    <PartyChip party={p} size="sm" />
                    <span className="text-gray-600">{partyOptionLabel(p)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default memo(NewsPartyPicker)
