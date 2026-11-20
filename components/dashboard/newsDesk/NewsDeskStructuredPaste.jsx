import { useState } from 'react'
import { KABURLU_NEWS_DESK_CHATGPT_PROMPT } from '../../../lib/newsDesk/chatGptStandardPrompt'
import {
  hasMeaningfulDeskParseResult,
  looksLikeStructuredNewsDeskPaste,
  parseStructuredNewsDeskPaste,
} from '../../../lib/newsDesk/structuredPaste'
import { Button, FormField, Textarea, toast } from '../../ui'

export default function NewsDeskStructuredPaste({ disabled, onParse, onUploadFiles }) {
  const [draft, setDraft] = useState('')
  const [parsing, setParsing] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)

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

  const runParse = async (text, files = []) => {
    const body = String(text || '').trim()
    if (!body) return
    const parsed = parseStructuredNewsDeskPaste(body)
  const canApply =
      looksLikeStructuredNewsDeskPaste(body) || hasMeaningfulDeskParseResult(parsed)
    if (!canApply) {
      toast.error('Use labeled blocks: Headline:, Article:, Category: … (ChatGPT **markdown** OK)')
      return
    }
    setParsing(true)
    try {
      await onParse(body, files)
      setDraft('')
      toast.success('Desk brief applied to form')
    } catch (error) {
      toast.error(error.message || 'Could not parse brief')
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
    if (looksLikeStructuredNewsDeskPaste(text) || hasMeaningfulDeskParseResult(parsed)) {
      e.preventDefault()
      await runParse(text, files)
      return
    }
    if (files.length && onUploadFiles) {
      e.preventDefault()
      await onUploadFiles(files)
      toast.success('Image pasted — uploading…')
    }
  }

  return (
    <div className="rounded-2xl border border-brand/25 bg-brand/[0.04] p-5 space-y-3">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Quick paste (one box)</h2>
        <p className="text-xs text-slate-600 mt-1">
          ChatGPT output (**Headline:** markdown) ని ఇక్కడ paste చేసి <strong>Apply to form</strong> — plain లేదా markdown labels రెండూ పని చేస్తాయి.
          Images విభాగంలో URL లేకుంటే &quot;Original Source Image&quot; అనిపిస్తే source నుండి lead image తీసుకుంటాం.
        </p>
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
          Apply to form
        </Button>
        <Button type="button" variant="ghost" disabled={disabled || parsing || !draft} onClick={() => setDraft('')}>
          Clear
        </Button>
      </div>

      <div className="border-t border-brand/15 pt-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Ref prompt — ChatGPT / AI</h3>
            <p className="text-xs text-slate-500 mt-0.5">Copy → ChatGPT లో paste చేసి source URL attach చేయండి.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onCopyPrompt}>
            {promptCopied ? '✓ Copied' : 'Copy prompt'}
          </Button>
        </div>
        <Textarea
          readOnly
          rows={14}
          value={KABURLU_NEWS_DESK_CHATGPT_PROMPT}
          className="font-mono text-[11px] leading-relaxed text-slate-700 bg-slate-50/90 cursor-text"
          onFocus={(e) => e.target.select()}
        />
      </div>
    </div>
  )
}