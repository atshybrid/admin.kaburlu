/**
 * Searchable party picker — state filter + name search (optimized for modals)
 */

import { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { politicalPartiesApi } from '../../../lib/api/services/politicalPartiesApi'
import { fetchPartiesForSurvey } from '../../../lib/politicalParties/fetchParties'
import { getPartiesForStateCached } from '../../../lib/politicalParties/partyCache'
import { filterPartiesBySearch, isNationalParty } from '../../../lib/politicalParties/filterParties'
import { normalizeParty, partyOptionLabel } from '../../../lib/politicalParties/normalize'
import PartyChip from './PartyChip'
import { Input, Spinner } from '../../ui'

function mergePartyLists(...lists) {
  const map = new Map()
  for (const list of lists) {
    for (const p of list || []) {
      if (!p?.id) continue
      if (!map.has(p.id)) map.set(p.id, p)
    }
  }
  return [...map.values()]
}

function PartySearchSelect({
  state = '',
  value = '',
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [cachedForState, setCachedForState] = useState([])
  const [apiResults, setApiResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCache, setLoadingCache] = useState(false)
  const wrapRef = useRef(null)

  const loadCache = useCallback(() => {
    const st = String(state || '').trim()
    if (!st || cachedForState.length) return
    setLoadingCache(true)
    getPartiesForStateCached(st)
      .then((list) => setCachedForState(list))
      .catch(() => setCachedForState([]))
      .finally(() => setLoadingCache(false))
  }, [state, cachedForState.length])

  useEffect(() => {
    setCachedForState([])
    setApiResults([])
    setOpen(false)
    setSearch('')
  }, [state])

  useEffect(() => {
    const term = String(search || '').trim()
    if (!term || !String(state || '').trim()) {
      setApiResults([])
      setLoading(false)
      return
    }
    const fromCache = filterPartiesBySearch(cachedForState, term)
    if (fromCache.length >= 1) {
      setApiResults([])
      setLoading(false)
      return
    }
    let cancelled = false
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const list = await fetchPartiesForSurvey({ state, q: term, limit: 40 })
        if (!cancelled) setApiResults(list)
      } catch {
        if (!cancelled) setApiResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [state, search, cachedForState])

  const { parties, showingAllForState } = useMemo(() => {
    const term = String(search || '').trim()
    if (!term) return { parties: cachedForState, showingAllForState: false }

    const fromCache = filterPartiesBySearch(cachedForState, term)
    const merged = mergePartyLists(apiResults, fromCache)
    if (merged.length) return { parties: merged, showingAllForState: false }
    if (cachedForState.length) return { parties: cachedForState, showingAllForState: true }
    return { parties: [], showingAllForState: false }
  }, [search, cachedForState, apiResults])

  const [selectedParty, setSelectedParty] = useState(null)

  useEffect(() => {
    if (!value) {
      setSelectedParty(null)
      return
    }
    const found = cachedForState.find((p) => p.id === value)
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
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [value, cachedForState])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const selected = selectedParty || cachedForState.find((p) => p.id === value)

  const pick = (party) => {
    setSelectedParty(party)
    onChange?.(party)
    setOpen(false)
    setSearch('')
  }

  const busy = loading || loadingCache
  const stateReady = Boolean(String(state || '').trim())

  return (
    <div ref={wrapRef} className="relative">
      {selected && !open ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <PartyChip party={selected} size="sm" />
          <button
            type="button"
            className="text-xs text-brand underline"
            onClick={() => {
              setOpen(true)
              setSearch('')
              loadCache()
            }}
            disabled={disabled}
          >
            Change
          </button>
        </div>
      ) : null}

      <Input
        placeholder={stateReady ? 'Type party name or code (e.g. BJP, BRS)…' : 'Select state first'}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          loadCache()
        }}
        disabled={disabled || !stateReady}
        className="bg-white"
      />

      {!stateReady ? (
        <p className="text-xs text-amber-700 mt-1">Choose state above first.</p>
      ) : (
        <p className="text-xs text-gray-500 mt-1">
          {loadingCache ? 'Loading parties…' : `${cachedForState.length || parties.length} parties · click to open`}
        </p>
      )}

      {open && stateReady ? (
        <div
          role="listbox"
          className="absolute z-[80] mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg overscroll-contain"
        >
          {showingAllForState && search.trim() ? (
            <p className="text-xs text-amber-800 bg-amber-50 px-3 py-2 border-b border-amber-100">
              No exact match — pick from list
            </p>
          ) : null}
          {busy && parties.length === 0 ? (
            <div className="flex justify-center py-5">
              <Spinner size="sm" />
            </div>
          ) : parties.length === 0 ? (
            <p className="text-sm text-gray-500 px-3 py-4 text-center">No parties found</p>
          ) : (
            <ul>
              {parties.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2.5 text-sm text-gray-900 hover:bg-brand/5 border-b border-gray-50 last:border-0 ${
                      value === p.id ? 'bg-brand/10 font-medium' : ''
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(p)}
                  >
                    {partyOptionLabel(p)}
                    {isNationalParty(p) ? (
                      <span className="ml-2 text-[10px] text-gray-400 uppercase">National</span>
                    ) : null}
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

export default memo(PartySearchSelect)
