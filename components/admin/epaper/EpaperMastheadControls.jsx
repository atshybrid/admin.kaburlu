import { useState } from 'react'
import { joinPublisherAreas } from '../../../lib/epaper/publicationFields'
import { Button, FormField, Input } from '../../ui'

function colorInputValue(hex) {
  const s = String(hex || '').trim()
  if (!s) return '#003366'
  const withHash = s.startsWith('#') ? s : `#${s}`
  if (/^#[0-9A-Fa-f]{6}$/i.test(withHash)) return withHash
  if (/^#[0-9A-Fa-f]{3}$/i.test(withHash)) {
    const r = withHash[1]
    const g = withHash[2]
    const b = withHash[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return '#003366'
}

export function HexColorField({ label, hint, value, onChange, disabled }) {
  return (
    <FormField label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          disabled={disabled}
          value={colorInputValue(value)}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-slate-200 p-0.5 disabled:opacity-50"
        />
        <Input
          disabled={disabled}
          className="font-mono text-sm"
          value={value || ''}
          placeholder="#003366"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </FormField>
  )
}

export function PublisherAreasField({ label, hint, areas, onChange, disabled, legacyText }) {
  const [draft, setDraft] = useState('')
  const list = Array.isArray(areas) ? areas : []

  const addArea = () => {
    const next = draft.trim()
    if (!next || disabled) return
    if (list.some((a) => a.toLowerCase() === next.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...list, next])
    setDraft('')
  }

  const preview = joinPublisherAreas(list) || String(legacyText || '').trim()

  return (
    <FormField
      label={label}
      hint={hint || 'Saved as list; masthead shows areas joined with •'}
      className="sm:col-span-2"
    >
      <div className="flex min-h-[2rem] flex-wrap gap-1.5">
        {list.map((area) => (
          <span
            key={area}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-2.5 pr-1 text-sm text-slate-800"
          >
            {area}
            <button
              type="button"
              disabled={disabled}
              className="rounded-full px-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
              aria-label={`Remove ${area}`}
              onClick={() => onChange(list.filter((a) => a !== area))}
            >
              ×
            </button>
          </span>
        ))}
        {!list.length ? <span className="text-sm text-slate-400">No areas yet</span> : null}
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          disabled={disabled}
          value={draft}
          placeholder="హైదరాబాద్"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addArea()
            }
          }}
        />
        <Button type="button" size="sm" variant="outline" disabled={disabled || !draft.trim()} onClick={addArea}>
          Add
        </Button>
      </div>
      {preview ? (
        <p className="mt-2 text-xs text-slate-500">
          <span className="font-medium text-slate-600">publishedAreaText preview:</span> {preview}
        </p>
      ) : null}
    </FormField>
  )
}

export function MastheadPublicationGrid({ values, onField, disabled }) {
  return (
    <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
      <FormField label="Editor name" hint="Masthead">
        <Input
          disabled={disabled}
          value={values.editorName || ''}
          placeholder="కత్యాద బాపు రావు"
          onChange={(e) => onField('editorName', e.target.value)}
        />
      </FormField>
      <FormField label="Chief editor">
        <Input
          disabled={disabled}
          value={values.chiefEditorName || ''}
          placeholder="BADDIPADIGE SRINIVAS REDDY"
          onChange={(e) => onField('chiefEditorName', e.target.value)}
        />
      </FormField>
      <HexColorField
        label="Page 1 sub-header band"
        hint="mainSubHeaderColor"
        disabled={disabled}
        value={values.mainSubHeaderColor}
        onChange={(v) => onField('mainSubHeaderColor', v)}
      />
      <HexColorField
        label="Page 2+ sub-header band"
        hint="innerSubHeaderColor"
        disabled={disabled}
        value={values.innerSubHeaderColor}
        onChange={(v) => onField('innerSubHeaderColor', v)}
      />
      <PublisherAreasField
        disabled={disabled}
        label="Publisher areas"
        areas={values.publisherAreas}
        legacyText={values.publishedAreaText}
        onChange={(next) => onField('publisherAreas', next)}
      />
    </div>
  )
}
