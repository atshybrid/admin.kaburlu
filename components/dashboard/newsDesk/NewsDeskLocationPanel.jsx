import { useCallback, useEffect, useState } from 'react'
import newsDeskApi, { formatNewsDeskError } from '../../../lib/api/services/newsDeskApi'
import { Button, Input, Spinner, toast } from '../../ui'
import { formatLocationHintDisplay } from '../../../lib/newsDesk/locationHint'

export default function NewsDeskLocationPanel({ jobId, locationHint }) {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState({ districts: [], mandals: [] })
  const [approved, setApproved] = useState(null)

  const loadApproved = useCallback(async () => {
    if (!jobId) return
    try {
      const res = await newsDeskApi.getApprovedLocation(jobId)
      setApproved(res?.location || null)
    } catch {
      setApproved(null)
    }
  }, [jobId])

  useEffect(() => {
    loadApproved()
  }, [loadApproved])

  const hint = formatLocationHintDisplay(locationHint)
  const summary = approved?.displayName || approved?.district?.name || hint

  const onSearch = async () => {
    const q = query.trim()
    if (q.length < 2) {
      toast.info('Type at least 2 characters')
      return
    }
    setLoading(true)
    try {
      const res = await newsDeskApi.searchLocations(q)
      setResults({ districts: res?.districts || [], mandals: res?.mandals || [] })
      setExpanded(true)
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setLoading(false)
    }
  }

  const onApprove = async (payload) => {
    setLoading(true)
    try {
      await newsDeskApi.approveLocation(jobId, payload)
      toast.success('Location approved for publish dateline')
      await loadApproved()
      setExpanded(false)
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-lg border border-slate-200/80 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">Location</h2>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {summary || 'No master location — search district or mandal'}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Close' : approved || hint ? 'Change' : 'Set location'}
        </Button>
      </div>

      {expanded ? (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search district or mandal…"
              className="max-w-sm flex-1 min-w-[10rem]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSearch()
              }}
            />
            <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={onSearch}>
              {loading ? <Spinner size="sm" /> : 'Search'}
            </Button>
          </div>

          {(results.districts.length > 0 || results.mandals.length > 0) && (
            <ul className="grid gap-1 sm:grid-cols-2 text-sm max-h-48 overflow-y-auto">
              {results.districts.map((d) => (
                <li key={`d-${d.id}`}>
                  <button
                    type="button"
                    className="w-full text-left rounded-md px-2 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100"
                    onClick={() => onApprove({ districtId: d.id, stateId: d.stateId, displayName: d.name })}
                  >
                    <span className="font-medium text-slate-800">{d.name}</span>
                    {d.state?.name ? <span className="text-slate-500 text-xs ml-1">({d.state.name})</span> : null}
                  </button>
                </li>
              ))}
              {results.mandals.map((m) => (
                <li key={`m-${m.id}`}>
                  <button
                    type="button"
                    className="w-full text-left rounded-md px-2 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100"
                    onClick={() =>
                      onApprove({
                        mandalId: m.id,
                        districtId: m.districtId,
                        displayName: [m.district?.name, m.name].filter(Boolean).join(', '),
                      })
                    }
                  >
                    <span className="font-medium text-slate-800">{m.name}</span>
                    {m.district?.name ? (
                      <span className="text-slate-500 text-xs ml-1">· {m.district.name}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  )
}