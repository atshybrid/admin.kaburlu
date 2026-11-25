/**
 * Mandal reporter — assign villages (search / approve) for news posting scope.
 */
import { useCallback, useEffect, useState } from 'react'
import { reportersApi } from '../../../lib/api/tenantApi'
import locationsService from '../../../lib/api/services/locations'

export default function ReporterCoverageVillages({ tenantId, reporterId, mandalId, enabled }) {
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [autoApproveBulk, setAutoApproveBulk] = useState(false)

  const loadFromParent = useCallback(async () => {
    if (!tenantId || !reporterId) return
    try {
      const d = await reportersApi.get(tenantId, reporterId)
      setRows(Array.isArray(d?.coverageVillages) ? d.coverageVillages : [])
    } catch {
      setRows([])
    }
  }, [tenantId, reporterId])

  useEffect(() => {
    if (enabled) loadFromParent()
  }, [enabled, loadFromParent])

  function rowExists(villageId) {
    return rows.some((r) => r.villageId === villageId)
  }

  function addHit(hit, source = 'search') {
    if (!hit?.villageId || rowExists(hit.villageId)) return
    setRows((prev) => [
      ...prev,
      {
        villageId: hit.villageId,
        name: hit.name,
        nativeName: hit.nativeName || null,
        status: 'PENDING',
        source,
        note: '',
        addedAt: new Date().toISOString(),
      },
    ])
  }

  async function runSearch() {
    const q = String(query || '').trim()
    if (q.length < 2) {
      setErr('గ్రామం పేరు కనీసం 2 అక్షరాలు')
      return
    }
    setSearching(true)
    setErr('')
    try {
      const res = await reportersApi.searchCoverageVillages(tenantId, reporterId, q, 40)
      setHits(res?.items || [])
      if (!(res?.items || []).length) setMsg('మ్యాచ్ లేదు — spell చూసి మళ్లీ try చేయండి')
    } catch (e) {
      setErr(e.message || 'Search failed')
      setHits([])
    } finally {
      setSearching(false)
    }
  }

  async function bulkCommaNames() {
    const text = String(bulkText || '').trim()
    if (text.length < 2) {
      setErr('గ్రామాల పేర్లు commas , లేదా new line తో ఇవ్వండి')
      return
    }
    setSearching(true)
    setErr('')
    setMsg('')
    try {
      const res = await reportersApi.bulkCoverageVillageNames(tenantId, reporterId, {
        names: text,
        autoApprove: autoApproveBulk,
        createIfMissing: true,
        saveCoverage: true,
      })
      setRows(res?.coverageVillages || [])
      const ok = (res?.imported || []).length
      const bad = (res?.errors || []).length
      setMsg(
        bad
          ? `${ok} added/updated, ${bad} failed — Telugu translation + search keys saved`
          : `${ok} villages added under this mandal — review & Save if needed`
      )
      setBulkText('')
    } catch (e) {
      setErr(e.message || 'Bulk add failed')
    } finally {
      setSearching(false)
    }
  }

  async function bulkSuggest() {
    if (!mandalId) return
    setSearching(true)
    setErr('')
    setMsg('')
    try {
      const res = await locationsService.villages.list({
        tenantId,
        mandalId,
        limit: 80,
      })
      const items = (res?.items || []).map((v) => ({
        villageId: v.id,
        name: v.name,
      }))
      let added = 0
      for (const it of items) {
        if (!rowExists(it.villageId)) {
          addHit(it, 'ai_bulk')
          added += 1
        }
      }
      setMsg(
        added
          ? `${added} గ్రామాలు pending జాబితాకు జోడించబడ్డాయి — approve చేయండి`
          : 'అన్ని ఇప్పటికే జాబితాలో ఉన్నాయి'
      )
    } catch (e) {
      setErr(e.message || 'Bulk load failed')
    } finally {
      setSearching(false)
    }
  }

  function approve(villageId) {
    setRows((prev) =>
      prev.map((r) =>
        r.villageId === villageId
          ? { ...r, status: 'APPROVED', approvedAt: new Date().toISOString() }
          : r
      )
    )
  }

  function remove(villageId) {
    setRows((prev) => prev.filter((r) => r.villageId !== villageId))
  }

  function approveAllPending() {
    setRows((prev) =>
      prev.map((r) =>
        r.status === 'PENDING' ? { ...r, status: 'APPROVED', approvedAt: new Date().toISOString() } : r
      )
    )
  }

  async function save() {
    setSaving(true)
    setErr('')
    setMsg('')
    try {
      const res = await reportersApi.saveCoverageVillages(tenantId, reporterId, rows)
      setRows(res?.coverageVillages || rows)
      setMsg('Coverage saved — మండల రిపోర్టర్ ఇక మీరు approve చేసిన గ్రామాలకే వార్తలు పోస్ట్ చేయగలడు')
    } catch (e) {
      setErr(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!enabled) return null

  const approvedCount = rows.filter((r) => r.status === 'APPROVED').length

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">గ్రామ కవరేజ్ (Mandal reporter)</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {approvedCount} approved · {rows.length} total villages in scope
          </p>
        </div>
      </div>

      {err && <p className="text-xs text-red-600">{err}</p>}
      {msg && <p className="text-xs text-emerald-700">{msg}</p>}

      <div className="rounded-lg border bg-white p-2 space-y-2">
        <label className="text-xs font-medium text-slate-700">Comma-separated villages (this mandal)</label>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={3}
          placeholder="Ramapur, Gopalpur, శివంపేట్, ..."
          className="w-full border rounded-lg px-2 py-1.5 text-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input type="checkbox" checked={autoApproveBulk} onChange={(e) => setAutoApproveBulk(e.target.checked)} />
            Auto-approve all
          </label>
          <button
            type="button"
            disabled={searching || !mandalId}
            onClick={bulkCommaNames}
            className="px-3 py-1.5 text-sm rounded-lg bg-brand text-white font-medium disabled:opacity-50"
          >
            {searching ? '…' : 'Add all names'}
          </button>
        </div>
        <p className="text-[10px] text-slate-500">
          Creates missing villages in DB, Telugu translation, fuzzy search keys (pgvector-ready vector in coverage).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="గ్రామం search (Telugu / English)"
          className="flex-1 min-w-[160px] border rounded-lg px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          disabled={searching}
          onClick={runSearch}
          className="px-3 py-1.5 text-sm rounded-lg bg-white border hover:bg-slate-100 disabled:opacity-50"
        >
          {searching ? '…' : 'Search'}
        </button>
        <button
          type="button"
          disabled={searching || !mandalId}
          onClick={bulkSuggest}
          className="px-3 py-1.5 text-sm rounded-lg bg-white border hover:bg-slate-100 disabled:opacity-50"
        >
          మండలం villages (bulk)
        </button>
      </div>

      {hits.length > 0 && (
        <ul className="max-h-32 overflow-y-auto rounded-lg border bg-white text-xs divide-y">
          {hits.map((h) => (
            <li key={h.villageId} className="flex items-center justify-between px-2 py-1.5">
              <span>
                {h.name}
                {h.nativeName && h.nativeName !== h.name ? (
                  <span className="text-slate-500"> · {h.nativeName}</span>
                ) : null}
              </span>
              <button
                type="button"
                disabled={rowExists(h.villageId)}
                onClick={() => addHit(h, 'search')}
                className="text-brand font-medium disabled:opacity-40"
              >
                {rowExists(h.villageId) ? 'Added' : '+ Add'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={approveAllPending} className="text-xs text-slate-600 underline">
          Approve all pending
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-2">Village</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Note</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-3 text-center text-slate-500">
                  ఇంకా గ్రామాలు లేవు — search చేసి జోడించండి
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.villageId} className="border-t">
                  <td className="p-2 font-medium">
                    {r.name}
                    {r.nativeName && r.nativeName !== r.name ? (
                      <span className="block text-[10px] text-slate-500 font-normal">{r.nativeName}</span>
                    ) : null}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {r.status === 'APPROVED' ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-2">
                    <input
                      value={r.note || ''}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((x) => (x.villageId === r.villageId ? { ...x, note: e.target.value } : x))
                        )
                      }
                      className="w-full border rounded px-1 py-0.5"
                      placeholder="optional"
                    />
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {r.status !== 'APPROVED' && (
                      <button type="button" onClick={() => approve(r.villageId)} className="text-brand mr-2">
                        Approve
                      </button>
                    )}
                    <button type="button" onClick={() => remove(r.villageId)} className="text-red-600">
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="w-full py-2 rounded-lg bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
      >
        {saving ? 'Saving coverage…' : 'Save village coverage'}
      </button>
    </div>
  )
}