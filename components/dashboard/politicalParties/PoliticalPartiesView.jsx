/**
 * India Political Parties — Super Admin module
 */

import { useState, useEffect, useCallback } from 'react'
import { politicalPartiesApi } from '../../../lib/api/services/politicalPartiesApi'
import { normalizeParty, normalizePartyList, partyDisplayName } from '../../../lib/politicalParties/normalize'
import PartyChip from './PartyChip'
import PartyDetailPanel from './PartyDetailPanel'
import { ApiError } from '../../../lib/api/client'
import {
  Button,
  FormField,
  Input,
  Modal,
  SlidePanel,
  Spinner,
  toast,
} from '../../ui'

const PAGE_SIZE = 25

const PRESETS = [
  { label: 'BJP', code: 'BJP', primary: '#FF9933', secondary: '#138808', symbolText: 'Lotus' },
  { label: 'INC', code: 'INC', primary: '#00AEEF', secondary: '#FFFFFF', symbolText: 'Hand' },
  { label: 'BRS', code: 'BRS', primary: '#E91E63', secondary: '#FFFFFF', symbolText: 'Car' },
  { label: 'AIMIM', code: 'AIMIM', primary: '#006B3F', secondary: '#FFFFFF', symbolText: 'Kite' },
]

function formatApiError(err, fallback) {
  if (err instanceof ApiError) {
    const code = err.data?.code
    return code ? `${err.message} (${code})` : err.message
  }
  return err?.message || fallback
}

export default function PoliticalPartiesView() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [selectedId, setSelectedId] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    partyCode: '',
    displayName: '',
    shortName: '',
    primaryColor: '#FF9933',
    secondaryColor: '#138808',
    symbolText: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = await politicalPartiesApi.listAdmin({
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(search.trim() ? { q: search.trim() } : {}),
      })
      const parsed = normalizePartyList(raw)
      setItems(parsed.items)
      setTotal(parsed.total)
      setTotalPages(parsed.totalPages)
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to load parties'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  const openParty = (party) => {
    const id = party.id || party.partyCode
    if (!id) return
    setSelectedId(id)
    setPanelOpen(true)
  }

  const applyPreset = (preset) => {
    setCreateForm((f) => ({
      ...f,
      partyCode: preset.code,
      displayName: preset.label === 'INC' ? 'Indian National Congress' : preset.label,
      shortName: preset.label,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      symbolText: preset.symbolText,
    }))
  }

  const handleCreate = async () => {
    const code = createForm.partyCode.trim().toUpperCase()
    if (!code || !createForm.displayName.trim()) {
      toast.error('Party code and display name are required')
      return
    }
    setCreating(true)
    try {
      const res = await politicalPartiesApi.create({
        partyCode: code,
        displayName: createForm.displayName.trim(),
        shortName: createForm.shortName.trim() || createForm.displayName.trim(),
        primaryColor: createForm.primaryColor,
        secondaryColor: createForm.secondaryColor,
        symbolText: createForm.symbolText.trim() || undefined,
      })
      toast.success(res?.message || 'Party created')
      setCreateOpen(false)
      setCreateForm({
        partyCode: '',
        displayName: '',
        shortName: '',
        primaryColor: '#FF9933',
        secondaryColor: '#138808',
        symbolText: '',
      })
      await load()
      const created = normalizeParty(res) || normalizePartyList(res).items?.[0]
      if (created?.id || created?.partyCode) {
        openParty(created)
      }
    } catch (err) {
      toast.error(formatApiError(err, 'Create failed'))
    } finally {
      setCreating(false)
    }
  }

  const selectedParty = items.find((p) => (p.id || p.partyCode) === selectedId)

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Indian Political Parties</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Manage party codes, brand colors, and election symbols for surveys and public pickers.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 shadow-sm">
          + Add party
        </Button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total parties</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-2xl font-bold text-gray-900">{items.filter((p) => p.isActive !== false).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">On this page (active)</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 col-span-2 sm:col-span-1">
          <p className="text-sm font-medium text-gray-700 truncate">API</p>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">/political-parties/admin</p>
        </div>
      </div>

      <form
        className="flex flex-col sm:flex-row gap-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80"
        onSubmit={(e) => {
          e.preventDefault()
          setSearch(searchInput)
          setPage(1)
        }}
      >
        <Input
          placeholder="Search BJP, Congress, symbol…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="bg-white flex-1"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
        <Button type="button" variant="ghost" onClick={load} loading={loading}>
          Refresh
        </Button>
      </form>

      {loading ? (
        <div className="flex flex-col items-center py-20">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-gray-500">Loading parties…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-600 font-medium">No parties found</p>
          <p className="text-sm text-gray-400 mt-1">Create BJP, INC, BRS, or search with another term.</p>
          <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
            Add first party
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((party) => {
            const id = party.id || party.partyCode
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => openParty(party)}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-brand/40 hover:shadow-md transition-all group"
                >
                  <PartyChip party={party} size="md" className="mb-3" />
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-brand">
                    {partyDisplayName(party)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{party.partyCode}</p>
                  <p className="text-xs text-brand mt-2 font-medium">Edit colors & symbol →</p>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      <SlidePanel
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false)
          setSelectedId(null)
        }}
        title="Party detail"
        subtitle={partyDisplayName(selectedParty || {})}
        width="lg"
      >
        {selectedId ? (
          <PartyDetailPanel
            partyId={selectedId}
            onUpdated={load}
            onDeactivated={() => {
              setPanelOpen(false)
              setSelectedId(null)
              load()
            }}
          />
        ) : null}
      </SlidePanel>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create political party"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button loading={creating} onClick={handleCreate}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">Quick presets (optional)</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2 py-1 text-xs rounded-lg border border-gray-200 hover:border-brand hover:text-brand"
              >
                {p.code}
              </button>
            ))}
          </div>
          <FormField label="Party code *">
            <Input
              value={createForm.partyCode}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, partyCode: e.target.value.toUpperCase() }))
              }
              placeholder="BJP"
              className="font-mono"
            />
          </FormField>
          <FormField label="Display name *">
            <Input
              value={createForm.displayName}
              onChange={(e) => setCreateForm((f) => ({ ...f, displayName: e.target.value }))}
            />
          </FormField>
          <FormField label="Short name">
            <Input
              value={createForm.shortName}
              onChange={(e) => setCreateForm((f) => ({ ...f, shortName: e.target.value }))}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Primary">
              <input
                type="color"
                value={createForm.primaryColor}
                onChange={(e) => setCreateForm((f) => ({ ...f, primaryColor: e.target.value }))}
                className="w-full h-10 rounded border border-gray-200"
              />
            </FormField>
            <FormField label="Secondary">
              <input
                type="color"
                value={createForm.secondaryColor}
                onChange={(e) => setCreateForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                className="w-full h-10 rounded border border-gray-200"
              />
            </FormField>
          </div>
          <FormField label="Symbol text">
            <Input
              value={createForm.symbolText}
              onChange={(e) => setCreateForm((f) => ({ ...f, symbolText: e.target.value }))}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  )
}
