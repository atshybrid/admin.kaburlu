import { Button, FormField, Input } from '../../ui'

export default function BillingDateRangeBar({ from, to, onFrom, onTo, onApply, loading }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <FormField label="From (IST)">
        <Input type="date" value={from} onChange={(e) => onFrom(e.target.value)} />
      </FormField>
      <FormField label="To (IST)">
        <Input type="date" value={to} onChange={(e) => onTo(e.target.value)} />
      </FormField>
      <Button type="button" onClick={onApply} loading={loading} className="sm:mb-0.5">
        Apply range
      </Button>
    </div>
  )
}
