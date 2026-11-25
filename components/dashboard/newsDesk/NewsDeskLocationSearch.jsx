import { useCallback, useEffect, useRef, useState } from 'react'
import newsDeskApi, { formatNewsDeskError } from '../../../lib/api/services/newsDeskApi'
import { canonicalStateFromText } from '../../../lib/newsDesk/locationHint'
import { Button, Input, Spinner, toast } from '../../ui'

const DEBOUNCE_MS = 450

function primaryLocationTerm({ query, state, district, mandal, area }) {
  const q = String(query || '').trim()
  if (q.length >= 2) return q
  const st = String(state || '').trim()
  const a = String(area || '').trim()
  const m = String(mandal || '').trim()
  const d = String(district || '').trim()
  if (st.length >= 2) return st
  if (a.length >= 2) return a
  if (m.length >= 2) return m
  if (d.length >= 2) return d
  return ''
}

/**
 * Master + AI resolve for create intake. Auto-runs when query or district/mandal/area change.
 */
export default function NewsDeskLocationSearch({
  disabled,
  onPick,
  selectedLabel,
  state = '',
  district = '',
  mandal = '',
  area = '',
}) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState({ states: [], districts: [], mandals: [] })
  const [lastSource, setLastSource] = useState(null)
  const debounceRef = useRef(null)
  const lastTermRef = useRef('')

  const applyPick = useCallback(
    (pick, source, needsReview) => {
      if (!pick) return
      let state = pick.state || ''
      let district = pick.district || ''
      let master = pick.master || null
      const districtAsState = canonicalStateFromText(district)
      if (master?.level === 'state' || districtAsState || (state && !district)) {
        if (districtAsState && !state) state = districtAsState
        district = ''
        master = {
          ...master,
          level: 'state',
          displayName: master?.displayName || state,
        }
      }
      onPick?.({
        state,
        district,
        mandal: pick.mandal || '',
        area: pick.area || area,
        master,
      })
      setLastSource(source)
      if (needsReview) {
        toast.info('Location needs review on submit — AI/master confirm చేయండి')
      } else if (source === 'master') {
        const label = master?.displayName || state || district
        toast.success(`Location matched: ${label}`)
      }
    },
    [onPick, area],
  )

  const runResolve = useCallback(
    async (term, { silent = false } = {}) => {
      const q = String(term || '').trim()
      if (q.length < 2) {
        setResults({ states: [], districts: [], mandals: [] })
        return
      }
      if (q === lastTermRef.current && silent) return
      lastTermRef.current = q
      setLoading(true)
      try {
        const res = await newsDeskApi.resolveLocation(q)
        setResults({
          states: res?.states || [],
          districts: res?.districts || [],
          mandals: res?.mandals || [],
        })
        setLastSource(res?.source || null)
        if (res?.pick && (res.source === 'master' || res.needsReview)) {
          applyPick(res.pick, res.source, res.needsReview)
        } else if (!silent && res?.message) {
          toast.info(res.message)
        }
      } catch (error) {
        if (!silent) toast.error(formatNewsDeskError(error))
      } finally {
        setLoading(false)
      }
    },
    [applyPick],
  )

  const scheduleResolve = useCallback(
    (term) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        runResolve(term, { silent: true })
      }, DEBOUNCE_MS)
    },
    [runResolve],
  )

  useEffect(() => {
    const term = primaryLocationTerm({ query, state, district, mandal, area })
    if (term.length >= 2) scheduleResolve(term)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, state, district, mandal, area, scheduleResolve])

  const onSearch = async () => {
    const term = primaryLocationTerm({ query, state, district, mandal, area })
    if (term.length < 2) {
      toast.info('Type at least 2 characters')
      return
    }
    await runResolve(term, { silent: false })
  }

  const pickState = (s) => {
    onPick?.({
      state: s.name,
      district: '',
      mandal: '',
      master: {
        stateId: s.id,
        displayName: s.name,
        level: 'state',
        resolution: 'master',
        needsReview: false,
      },
    })
    toast.success(`State: ${s.name}`)
  }

  const pickDistrict = (d) => {
    onPick?.({
      state: d.state?.name || '',
      district: d.name,
      mandal: '',
      master: {
        districtId: d.id,
        stateId: d.stateId,
        displayName: d.name,
        level: 'district',
        resolution: 'master',
        needsReview: false,
      },
    })
    toast.success(`District: ${d.name}`)
  }

  const pickMandal = (m) => {
    const displayName = [m.district?.name, m.name].filter(Boolean).join(', ')
    onPick?.({
      district: m.district?.name || '',
      mandal: m.name,
      master: {
        districtId: m.districtId,
        mandalId: m.id,
        displayName,
        resolution: 'master',
        needsReview: false,
      },
    })
    toast.success(`Mandal: ${displayName}`)
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <p className="text-xs text-slate-600">
        పేరు టైప్ చేస్తేనే master DB search (auto). లేకుంటే AI suggestion — review కి snapshot లో save.
      </p>
      {selectedLabel ? (
        <p className="text-sm font-medium text-slate-800">
          Selected: {selectedLabel}
          {lastSource === 'ai' ? (
            <span className="ml-2 text-xs font-normal text-amber-800">· AI — review</span>
          ) : null}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search state, district, or mandal…"
          className="max-w-xs"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSearch()
            }
          }}
        />
        <Button type="button" size="sm" variant="outline" disabled={disabled || loading} onClick={onSearch}>
          {loading ? <Spinner size="sm" /> : 'Search now'}
        </Button>
        {loading ? <span className="text-xs text-slate-500">Searching…</span> : null}
      </div>
      <ul className="space-y-1 text-sm max-h-36 overflow-y-auto">
        {results.states.map((s) => (
          <li key={`s-${s.id}`}>
            <button
              type="button"
              className="text-left w-full px-2 py-1 rounded hover:bg-white disabled:opacity-50 font-medium"
              disabled={disabled}
              onClick={() => pickState(s)}
            >
              State · {s.name}
            </button>
          </li>
        ))}
        {results.districts.map((d) => (
          <li key={`d-${d.id}`}>
            <button
              type="button"
              className="text-left w-full px-2 py-1 rounded hover:bg-white disabled:opacity-50"
              disabled={disabled}
              onClick={() => pickDistrict(d)}
            >
              District · {d.name}
              {d.state?.name ? <span className="text-slate-500"> ({d.state.name})</span> : null}
            </button>
          </li>
        ))}
        {results.mandals.map((m) => (
          <li key={`m-${m.id}`}>
            <button
              type="button"
              className="text-left w-full px-2 py-1 rounded hover:bg-white disabled:opacity-50"
              disabled={disabled}
              onClick={() => pickMandal(m)}
            >
              Mandal · {m.name}
              {m.district?.name ? <span className="text-slate-500"> · {m.district.name}</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}