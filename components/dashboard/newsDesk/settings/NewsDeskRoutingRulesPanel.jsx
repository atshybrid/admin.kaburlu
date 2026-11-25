import { useCallback, useEffect, useState } from 'react'
import newsDeskApi, { formatNewsDeskError } from '../../../../lib/api/services/newsDeskApi'
import { Button, Input, Spinner, toast } from '../../../ui'
import NewsDeskSection from '../NewsDeskSection'

const emptyRule = () => ({
  name: '',
  priority: 100,
  enabled: true,
  includeTenantIds: [],
  conditions: {},
})

export default function NewsDeskRoutingRulesPanel() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyRule())
  const [tenantIdsText, setTenantIdsText] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await newsDeskApi.listRoutingRules()
      setItems(res?.items || [])
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const createRule = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Rule name is required')
      return
    }
    setSaving(true)
    try {
      const includeTenantIds = tenantIdsText
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      await newsDeskApi.createRoutingRule({ ...form, includeTenantIds })
      toast.success('Routing rule created')
      setForm(emptyRule())
      setTenantIdsText('')
      await load()
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    } finally {
      setSaving(false)
    }
  }

  const toggleEnabled = async (rule) => {
    try {
      await newsDeskApi.updateRoutingRule(rule.id, { enabled: !rule.enabled })
      await load()
    } catch (error) {
      toast.error(formatNewsDeskError(error))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <NewsDeskSection title="Add routing rule" subtitle="W3+ engine will consume these rules; safe to configure now">
        <form onSubmit={createRule} className="space-y-3 max-w-xl">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input
            label="Priority (lower = first)"
            type="number"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
          />
          <Input
            label="Include tenant IDs (comma-separated)"
            value={tenantIdsText}
            onChange={(e) => setTenantIdsText(e.target.value)}
            placeholder="cuid1, cuid2"
          />
          <Button type="submit" disabled={saving} size="sm">
            {saving ? 'Saving…' : 'Add rule'}
          </Button>
        </form>
      </NewsDeskSection>

      <NewsDeskSection title="Active rules" subtitle={`${items.length} configured`} unpadded>
        <ul className="divide-y divide-slate-100">
          {items.map((rule) => (
            <li
              key={rule.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50/80"
            >
              <div>
                <p className="font-medium text-slate-900 text-sm">{rule.name}</p>
                <p className="text-xs text-slate-500">
                  Priority {rule.priority} · {(rule.includeTenantIds || []).length} tenant(s) ·{' '}
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => toggleEnabled(rule)}>
                {rule.enabled ? 'Disable' : 'Enable'}
              </Button>
            </li>
          ))}
          {!items.length ? <li className="px-4 py-8 text-sm text-slate-500 text-center">No routing rules yet.</li> : null}
        </ul>
      </NewsDeskSection>
    </div>
  )
}