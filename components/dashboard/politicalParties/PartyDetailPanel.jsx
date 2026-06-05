/**
 * Party detail — colors, symbol URL, symbol upload, deactivate
 */

import { useState, useEffect } from 'react'
import { politicalPartiesApi } from '../../../lib/api/services/politicalPartiesApi'
import { normalizeParty, partyColors } from '../../../lib/politicalParties/normalize'
import PartyChip from './PartyChip'
import { Button, Card, CardRow, FormField, Input, Spinner, toast } from '../../ui'
import { ApiError } from '../../../lib/api/client'

function formatApiError(err, fallback) {
  if (err instanceof ApiError) {
    const code = err.data?.code
    return code ? `${err.message} (${code})` : err.message
  }
  return err?.message || fallback
}

export default function PartyDetailPanel({ partyId, onUpdated, onDeactivated }) {
  const [party, setParty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [colors, setColors] = useState({ primaryColor: '#FF9933', secondaryColor: '#138808' })
  const [symbol, setSymbol] = useState({ symbolText: '', symbolUrl: '' })
  const [savingColors, setSavingColors] = useState(false)
  const [savingSymbol, setSavingSymbol] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  const load = async () => {
    if (!partyId) return
    setLoading(true)
    try {
      const raw = await politicalPartiesApi.getAdmin(partyId)
      const p = normalizeParty(raw)
      setParty(p)
      if (p) {
        setColors({
          primaryColor: p.primaryColor || '#1e3a5f',
          secondaryColor: p.secondaryColor || '#ffffff',
        })
        setSymbol({
          symbolText: p.symbolText || '',
          symbolUrl: p.symbolUrl || p.symbolImageUrl || '',
        })
      }
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to load party'))
      setParty(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyId])

  const refresh = async () => {
    await load()
    onUpdated?.()
  }

  const saveColors = async () => {
    setSavingColors(true)
    try {
      await politicalPartiesApi.updateColors(partyId, {
        primaryColor: colors.primaryColor,
        secondaryColor: colors.secondaryColor,
        colorSource: 'MANUAL',
      })
      toast.success('Party colors saved')
      await refresh()
    } catch (err) {
      toast.error(formatApiError(err, 'Save colors failed'))
    } finally {
      setSavingColors(false)
    }
  }

  const saveSymbol = async () => {
    setSavingSymbol(true)
    try {
      await politicalPartiesApi.updateSymbol(partyId, {
        symbolText: symbol.symbolText.trim() || undefined,
        symbolUrl: symbol.symbolUrl.trim() || undefined,
      })
      toast.success('Symbol updated')
      await refresh()
    } catch (err) {
      toast.error(formatApiError(err, 'Save symbol failed'))
    } finally {
      setSavingSymbol(false)
    }
  }

  const onFilePick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    setUploading(true)
    try {
      const res = await politicalPartiesApi.uploadSymbol(partyId, fd)
      toast.success(res?.message || 'Symbol uploaded')
      await refresh()
    } catch (err) {
      toast.error(formatApiError(err, 'Upload failed'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const deactivate = async () => {
    if (!window.confirm(`Deactivate ${party?.displayName || party?.partyCode}?`)) return
    setDeactivating(true)
    try {
      await politicalPartiesApi.deactivate(partyId)
      toast.success('Party deactivated')
      onDeactivated?.()
    } catch (err) {
      toast.error(formatApiError(err, 'Deactivate failed'))
    } finally {
      setDeactivating(false)
    }
  }

  if (loading && !party) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (!party) {
    return <p className="text-sm text-gray-500 py-8 text-center">Party not found.</p>
  }

  const previewParty = {
    ...party,
    primaryColor: colors.primaryColor,
    secondaryColor: colors.secondaryColor,
    symbolText: symbol.symbolText,
    symbolUrl: symbol.symbolUrl,
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-wrap items-center gap-3">
        <PartyChip party={previewParty} size="lg" />
        {party.isActive === false ? (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            Inactive
          </span>
        ) : (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
            Active
          </span>
        )}
      </div>

      <Card title="Identity">
        <CardRow label="Party code" value={<span className="font-mono">{party.partyCode}</span>} />
        <CardRow label="Display name" value={party.displayName || '—'} />
        <CardRow label="Short name" value={party.shortName || '—'} />
        <CardRow label="Color source" value={party.colorSource || '—'} />
      </Card>

      <Card title="Brand colors">
        <p className="text-xs text-gray-500 mb-4">
          Used in survey chips, journalist union UI, and public party picker.
        </p>
        <div
          className="h-16 rounded-xl mb-4 border border-gray-200 shadow-inner"
          style={{
            background: `linear-gradient(90deg, ${colors.primaryColor}, ${colors.secondaryColor})`,
          }}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Primary color">
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={colors.primaryColor}
                onChange={(e) => setColors((c) => ({ ...c, primaryColor: e.target.value }))}
                className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
              />
              <Input
                value={colors.primaryColor}
                onChange={(e) => setColors((c) => ({ ...c, primaryColor: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>
          </FormField>
          <FormField label="Secondary color">
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={colors.secondaryColor}
                onChange={(e) => setColors((c) => ({ ...c, secondaryColor: e.target.value }))}
                className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
              />
              <Input
                value={colors.secondaryColor}
                onChange={(e) => setColors((c) => ({ ...c, secondaryColor: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>
          </FormField>
        </div>
        <Button size="sm" className="mt-4" loading={savingColors} onClick={saveColors}>
          Save colors
        </Button>
      </Card>

      <Card title="Election symbol">
        <div className="flex flex-wrap gap-4 items-start mb-4">
          {(symbol.symbolUrl || party.symbolUrl) && (
            <img
              src={symbol.symbolUrl || party.symbolUrl}
              alt="Symbol"
              className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-gray-50 p-2"
            />
          )}
          <div className="flex-1 min-w-[200px] space-y-3">
            <FormField label="Symbol text (fallback)">
              <Input
                placeholder="e.g. Lotus"
                value={symbol.symbolText}
                onChange={(e) => setSymbol((s) => ({ ...s, symbolText: e.target.value }))}
              />
            </FormField>
            <FormField label="Symbol image URL">
              <Input
                placeholder="https://cdn.../symbol.png"
                value={symbol.symbolUrl}
                onChange={(e) => setSymbol((s) => ({ ...s, symbolUrl: e.target.value }))}
              />
            </FormField>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" loading={savingSymbol} onClick={saveSymbol}>
            Save symbol fields
          </Button>
          <label className="inline-flex">
            <input type="file" accept="image/*" className="hidden" onChange={onFilePick} disabled={uploading} />
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer ${
                uploading
                  ? 'opacity-50 border-gray-200 text-gray-400'
                  : 'border-brand text-brand hover:bg-brand/5'
              }`}
            >
              {uploading ? 'Uploading…' : 'Upload symbol file'}
            </span>
          </label>
        </div>
      </Card>

      <div className="pt-2 border-t border-gray-100">
        <Button size="sm" variant="danger" loading={deactivating} onClick={deactivate}>
          Deactivate party
        </Button>
      </div>
    </div>
  )
}
