import { useState } from 'react'
import { KABURLU_NEWS_DESK_CHATGPT_PROMPT } from '../../../lib/newsDesk/chatGptStandardPrompt'
import {
  parseStructuredNewsDeskPaste,
  validateDeskBriefForApply,
} from '../../../lib/newsDesk/structuredPaste'
import { Button, FormField, Textarea, toast } from '../../ui'

export default function NewsDeskStructuredPaste({ disabled, onParse, onUploadFiles, onApplied }) {
  const [draft, setDraft] = useState('')
  const [parsing, setParsing] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)
  const [lastApplied, setLastApplied] = useState('')
  const [view, setView] = useState('expanded')
  const [showPrompt, setShowPrompt] = useState(true)

  const onCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(KABURLU_NEWS_DESK_CHATGPT_PROMPT)
      setPromptCopied(true)
      toast.success('ChatGPT prompt copied')
      setTimeout(() => setPromptCopied(false), 2500)
    } catch {
      toast.error('Copy failed — select the prompt below and copy manually')
    }
  }

  const runParse = async (text, files = [], { auto = false } = {}) => {
    const body = String(text || '').trim()
    if (!body) {
      if (!auto) toast.error('Paste ChatGPT output in the box first')
      return false
    }
    const parsed = parseStructuredNewsDeskPaste(body)
    const check = validateDeskBriefForApply(parsed)
    if (!check.ok) {
      if (!auto) toast.error(check.message)
      return false
    }

    setParsing(true)
    try {
      const { summary } = await onParse(body, files)
      const applied = (summary || []).filter((s) => !s.includes('unmatched'))
      const headlineHint = parsed.headline ? parsed.headline.slice(0, 72) : ''
      const msg = applied.length
        ? `Applied: ${applied.join(', ')}`
        : 'Applied to intake form'
      setLastApplied(headlineHint ? `${msg} — ${headlineHint}${parsed.headline.length > 72 ? '…' : ''}` : msg)
      setView('collapsed')
      if (auto) toast.success('Auto-applied — review the form below')
      else toast.success(msg)
      onApplied?.()
      return true
    } catch (error) {
      toast.error(error.message || 'Could not parse brief')
      return false
    } finally {
      setParsing(false)
    }
  }

  const onPaste = async (e) => {
    if (disabled || parsing) return
    const text = e.clipboardData?.getData('text/plain') || ''
    const files = []
    for (const item of e.clipboardData?.items || []) {
      if (item.kind === 'file' && item.type?.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }

    const parsed = parseStructuredNewsDeskPaste(text)
    if (text.trim() && validateDeskBriefForApply(parsed).ok) {
      e.preventDefault()
      setDraft(text)
      await runParse(text, files, { auto: true })
      return
    }

    if (files.length && onUploadFiles) {
      e.preventDefault()
      await onUploadFiles(files)
      toast.success('Image pasted — uploading…')
    }
  }

  if (view === 'collapsed') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-900">✓ Desk brief applied</p>
          <p className="text-xs text-emerald-800/90 truncate mt-0.5" title={lastApplied}>
            {lastApplied || 'Intake fields filled — edit below and submit'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={() => onApplied?.()}>
            Focus form
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={() => setView('expanded')}>
            Edit brief / prompt
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-brand/25 bg-brand/[0.04] p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Quick paste (one box)</h2>
          <p className="text-xs text-slate-600 mt-1">
            పూర్తి ChatGPT output paste చేస్తే <strong>auto-apply</strong> అవుతుంది; లేదా paste అయిన తర్వాత{' '}
            <strong>Apply to form</strong>. ఫెల్ అయిన తర్వాత బాక్స్ దాచిపెట్టి form మీద focus.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="text-slate-600" onClick={onCopyPrompt}>
          {promptCopied ? '✓ Prompt copied' : 'Copy prompt'}
        </Button>
      </div>
      <FormField label="Desk brief">
        <Textarea
          rows={10}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={onPaste}
          disabled={disabled || parsing}
          placeholder={`Headline:\n\n…\n\nArticle:\n\n…\n\nCategory:\n\n…\n\nImages:\n\nhttps://… or Original Source Image`}
          className="font-mono text-[13px] leading-relaxed"
        />
      </FormField>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={disabled || parsing || !draft.trim()}
          onClick={() => runParse(draft, [])}
        >
          {parsing ? 'Applying…' : 'Apply to form'}
        </Button>
        <Button type="button" variant="ghost" disabled={disabled || parsing || !draft} onClick={() => setDraft('')}>
          Clear
        </Button>
        <Button type="button" variant="ghost" disabled={parsing} onClick={() => setShowPrompt((v) => !v)}>
          {showPrompt ? 'Hide ref prompt' : 'Show ref prompt'}
        </Button>
      </div>

      {showPrompt ? (
        <div className="border-t border-brand/15 pt-4 space-y-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Ref prompt — ChatGPT / AI</h3>
            <p className="text-xs text-slate-500 mt-0.5">Copy → ChatGPT లో paste చేసి source URL attach చేయండి.</p>
          </div>
          <Textarea
            readOnly
            rows={12}
            value={KABURLU_NEWS_DESK_CHATGPT_PROMPT}
            className="font-mono text-[11px] leading-relaxed text-slate-700 bg-slate-50/90 cursor-text"
            onFocus={(e) => e.target.select()}
          />
        </div>
      ) : null}
    </div>
  )
}