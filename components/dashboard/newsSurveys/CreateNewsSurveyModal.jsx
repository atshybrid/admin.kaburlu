/**
 * Create News Survey — title, question, party, frame upload, answer options
 */

import { useState, useEffect } from 'react'
import { newsSurveysApi } from '../../../lib/api/services/newsSurveysApi'
import { normalizeSurvey } from '../../../lib/newsSurveys/normalize'
import { partyColors } from '../../../lib/politicalParties/normalize'
import NewsPartyPicker from './NewsPartyPicker'
import ImageUpload from '../../ui/ImageUpload'
import { Button, FormField, Input, Modal, Textarea, toast } from '../../ui'
import { ApiError } from '../../../lib/api/client'

const PRESET_ANSWERS = [
  { id: 'BJP', label: 'BJP', color: '#FF9933' },
  { id: 'INC', label: 'Congress', color: '#19AAED' },
  { id: 'BRS', label: 'BRS', color: '#E91E63' },
  { id: 'AIMIM', label: 'AIMIM', color: '#006B3F' },
  { id: 'OTHER', label: 'Other', color: '#64748b' },
]

function slugId(label) {
  return String(label || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24) || 'OPTION'
}

function formatErr(err, fb) {
  if (err instanceof ApiError) return err.data?.code ? `${err.message} (${err.data.code})` : err.message
  return err?.message || fb
}

function AnswerRow({ answer, onChange, onRemove, canRemove }) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50/80">
      <input
        type="color"
        value={answer.color || '#3b82f6'}
        onChange={(e) => onChange({ ...answer, color: e.target.value })}
        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer shrink-0"
        title="Answer color"
      />
      <Input
        value={answer.label}
        onChange={(e) => {
          const label = e.target.value
          onChange({ ...answer, label, id: answer.id || slugId(label) })
        }}
        placeholder="Label"
        className="flex-1 min-w-[120px]"
      />
      <Input
        value={answer.id}
        onChange={(e) => onChange({ ...answer, id: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
        placeholder="ID"
        className="w-28 font-mono text-xs"
      />
      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
        >
          Remove
        </button>
      ) : null}
    </div>
  )
}

export default function CreateNewsSurveyModal({ isOpen, onClose, onCreated }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    question: '',
    politicalPartyId: '',
    selectedParty: null,
    frameImageUrl: '',
    tenantId: '',
    answers: PRESET_ANSWERS.slice(0, 4),
  })

  useEffect(() => {
    if (!isOpen) return
    setForm({
      title: '',
      question: '',
      politicalPartyId: '',
      selectedParty: null,
      frameImageUrl: '',
      tenantId: '',
      answers: PRESET_ANSWERS.slice(0, 4),
    })
  }, [isOpen])

  const onPartyPick = (party) => {
    if (!party) return
    const code = party.partyCode || party.shortCode || slugId(party.displayName)
    const { primary } = partyColors(party)
    setForm((f) => {
      const hasParty = f.answers.some((a) => a.id === code)
      const answers = hasParty
        ? f.answers
        : [{ id: code, label: party.shortName || party.displayName || code, color: primary }, ...f.answers].slice(0, 6)
      return {
        ...f,
        politicalPartyId: party.id,
        selectedParty: party,
        answers,
      }
    })
  }

  const updateAnswer = (idx, next) => {
    setForm((f) => ({
      ...f,
      answers: f.answers.map((a, i) => (i === idx ? next : a)),
    }))
  }

  const addAnswer = () => {
    setForm((f) => ({
      ...f,
      answers: [...f.answers, { id: `OPT_${f.answers.length + 1}`, label: '', color: '#94a3b8' }],
    }))
  }

  const removeAnswer = (idx) => {
    setForm((f) => ({
      ...f,
      answers: f.answers.filter((_, i) => i !== idx),
    }))
  }

  const handleCreate = async () => {
    const title = form.title.trim()
    const question = form.question.trim()
    if (!title) {
      toast.error('Survey title is required')
      return
    }
    if (!question) {
      toast.error('Survey question is required')
      return
    }
    if (!form.politicalPartyId) {
      toast.error('Select a political party')
      return
    }
    const answers = form.answers
      .map((a) => ({
        id: String(a.id || slugId(a.label)).trim(),
        label: String(a.label || a.id).trim(),
        color: a.color || '#64748b',
      }))
      .filter((a) => a.id && a.label)

    if (answers.length < 2) {
      toast.error('Add at least 2 answer options')
      return
    }

    setSaving(true)
    try {
      const body = {
        title,
        question,
        politicalPartyId: form.politicalPartyId,
        frameImageUrl: form.frameImageUrl || null,
        tenantId: form.tenantId.trim() || null,
        answers,
      }
      const res = await newsSurveysApi.create(body)
      const survey = normalizeSurvey(res?.survey || res)
      toast.success('Survey created successfully')
      onCreated?.(survey)
      onClose()
    } catch (err) {
      toast.error(formatErr(err, 'Failed to create survey'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      contentOverflow="visible"
      title="Create News Survey"
      subtitle="Election poll with video responses from reporters"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={handleCreate}>
            Create survey
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Survey title *" hint="shown in admin & app">
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="2026 Election Survey"
            />
          </FormField>
          <FormField label="Tenant ID" hint="leave empty = all tenants">
            <Input
              value={form.tenantId}
              onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))}
              placeholder="Optional — cmk7..."
              className="font-mono text-sm"
            />
          </FormField>
        </div>

        <FormField label="Question *" hint="reporters answer on video">
          <Textarea
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            rows={2}
            placeholder="Meeku ye party gelustundi?"
          />
        </FormField>

        <FormField label="Political party *">
          <NewsPartyPicker value={form.politicalPartyId} onChange={onPartyPick} />
        </FormField>

        <FormField label="Frame image" hint="overlay on video responses — upload or paste URL">
          <ImageUpload
            value={form.frameImageUrl}
            onChange={(url) => setForm((f) => ({ ...f, frameImageUrl: url }))}
            folder="news-surveys/frames"
            label="Upload frame"
            maxSizeMB={3}
            showPreview
          />
        </FormField>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-gray-800">Answer options *</p>
              <p className="text-xs text-gray-500">Min 2 — each gets a color chip in the app</p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={addAnswer}>
              + Add option
            </Button>
          </div>
          <div className="space-y-2">
            {form.answers.map((a, idx) => (
              <AnswerRow
                key={`${a.id}-${idx}`}
                answer={a}
                onChange={(next) => updateAnswer(idx, next)}
                onRemove={() => removeAnswer(idx)}
                canRemove={form.answers.length > 2}
              />
            ))}
          </div>
          <button
            type="button"
            className="text-xs text-brand mt-2 hover:underline"
            onClick={() => setForm((f) => ({ ...f, answers: PRESET_ANSWERS.slice(0, 4) }))}
          >
            Reset to Telangana presets (BJP, INC, BRS, AIMIM)
          </button>
        </div>
      </div>
    </Modal>
  )
}
