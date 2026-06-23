/**
 * Feeds config — persona keywords & sub-roles for Naa Kaburlu filters
 */

import { useCallback, useEffect, useState } from 'react'
import { readersAdminApi } from '../../../lib/api/services/readersAdminApi'
import { normalizePersonas } from '../../../lib/readers/normalize'
import { formatReaderAdminError } from '../../../lib/readers/readerErrors'
import { Button, EmptyState, Spinner, toast } from '../../ui'

export default function FeedsConfigTab({ refreshKey = 0 }) {
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [jsonText, setJsonText] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw = await readersAdminApi.getFeedsConfig()
      const list = normalizePersonas(raw)
      setPersonas(list)
      setJsonText(JSON.stringify(list, null, 2))
    } catch (err) {
      toast.error(formatReaderAdminError(err, 'Failed to load feeds config'))
      setPersonas([])
      setJsonText('[]')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const handleSave = async () => {
    let parsed
    try {
      parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) throw new Error('Root must be a personas array')
    } catch (e) {
      toast.error(e.message || 'Invalid JSON')
      return
    }

    setSaving(true)
    try {
      const res = await readersAdminApi.putFeedsConfig(parsed)
      const saved = normalizePersonas(res)
      setPersonas(saved)
      setJsonText(JSON.stringify(saved, null, 2))
      toast.success('Feeds config saved')
    } catch (err) {
      toast.error(formatReaderAdminError(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!personas.length && !jsonText.trim()) {
    return <EmptyState title="No feeds config" subtitle="Backend returned an empty personas list." />
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <p className="text-sm text-slate-500">
        Edit persona keywords and sub-roles used by Naa Kaburlu content filters. Send the full
        personas array — missing keys are merged with server defaults.
      </p>
      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        rows={22}
        className="w-full font-mono text-xs rounded-xl border border-slate-200 p-4 focus:ring-2 focus:ring-brand/20 focus:border-brand"
        spellCheck={false}
      />
      <div className="flex gap-2">
        <Button onClick={handleSave} loading={saving}>
          Save feeds config
        </Button>
        <Button variant="outline" onClick={load} disabled={saving}>
          Reload
        </Button>
      </div>
    </div>
  )
}
