/**
 * Visual survey question builder — types, answers, party options
 */

import { useState } from 'react'
import { fetchPartiesForSurvey } from '../../../lib/politicalParties/fetchParties'
import { partyOptionLabel } from '../../../lib/politicalParties/normalize'
import {
  QUESTION_TYPES,
  defaultQuestionsForSurveyType,
  newQuestion,
  newOption,
} from '../../../lib/unionSurveys/questionTypes'
import { Button, FormField, Input, toast } from '../../ui'

const ADD_BUTTONS = [
  { type: 'SINGLE_CHOICE', label: '+ Choice (with answers)', variant: 'primary' },
  { type: 'YES_NO', label: '+ Yes / No', variant: 'secondary' },
  { type: 'VIDEO_UPLOAD', label: '+ Video', variant: 'secondary' },
  { type: 'TEXT', label: '+ Text', variant: 'ghost' },
]

function typeSummary(question) {
  const t = question.questionType
  if (t === 'SINGLE_CHOICE') {
    const n = (question.options || []).filter((o) => String(o.label || o.id || '').trim()).length
    return `${n} answer${n === 1 ? '' : 's'}`
  }
  if (t === 'YES_NO') return 'Yes / No'
  if (t === 'VIDEO_UPLOAD') return `Video · ${question.videoMaxSeconds ?? 30}s`
  if (t === 'TEXT') return 'Text'
  return ''
}

function QuestionCard({
  question,
  index,
  total,
  state,
  surveyType,
  partyCode,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}) {
  const typeMeta = QUESTION_TYPES.find((t) => t.value === question.questionType) || QUESTION_TYPES[0]
  const hasAnswers = question.questionType === 'SINGLE_CHOICE'

  const patch = (partial) => onChange({ ...question, ...partial })

  const patchOption = (optKey, partial) => {
    const options = (question.options || []).map((o) =>
      o._key === optKey ? { ...o, ...partial } : o
    )
    patch({ options })
  }

  const addOption = () => {
    patch({ options: [...(question.options || []), newOption()] })
  }

  const removeOption = (optKey) => {
    const next = (question.options || []).filter((o) => o._key !== optKey)
    patch({ options: next.length ? next : [newOption()] })
  }

  const loadPartiesIntoOptions = async () => {
    if (!state?.trim()) {
      toast.error('Select state in step 1 first')
      return
    }
    try {
      const parties = await fetchPartiesForSurvey({ state, limit: 80 })
      const options = parties.map((p) =>
        newOption({
          id: p.partyCode || p.id,
          label: partyOptionLabel(p),
          color: p.primaryColor,
          symbolUrl: p.symbolUrl || '',
        })
      )
      if (!options.length) {
        toast.error('No parties found for this state')
        return
      }
      patch({ options })
      toast.success(`${options.length} party answers loaded`)
    } catch (err) {
      toast.error(err.message || 'Failed to load parties')
    }
  }

  const addSelectedPartyAsOption = () => {
    if (!partyCode?.trim()) {
      toast.error('Select political party in step 1 first')
      return
    }
    const opt = newOption({
      id: partyCode.trim().toUpperCase(),
      label: partyCode.trim().toUpperCase(),
      color: '#1e3a5f',
    })
    const existing = question.options || []
    if (existing.some((o) => String(o.id).toUpperCase() === opt.id)) {
      toast.info('Party already in answers')
      return
    }
    patch({ options: [...existing, opt] })
    toast.success('Party added as answer')
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white text-xs font-bold">
            {index + 1}
          </span>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-gray-800">{typeMeta.label}</span>
            <span className="ml-2 text-xs text-gray-500">{typeSummary(question)}</span>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index >= total - 1}
            onClick={onMoveDown}
            className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <FormField label="Question type">
          <select
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={question.questionType}
            onChange={(e) => {
              const next = e.target.value
              const opts =
                next === 'SINGLE_CHOICE'
                  ? question.options?.length >= 2
                    ? question.options
                    : [newOption(), newOption()]
                  : []
              patch({ questionType: next, options: opts })
            }}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
                {t.hasOptions ? ' — add answers below' : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">{typeMeta.hint}</p>
        </FormField>

        <FormField label="Question (English) *">
          <Input
            value={question.questionText}
            onChange={(e) => patch({ questionText: e.target.value })}
            placeholder="2026 lo ee party gelustundi?"
          />
        </FormField>

        <FormField label="Question (Telugu / native)">
          <Input
            value={question.nativeQuestionText}
            onChange={(e) => patch({ nativeQuestionText: e.target.value })}
            placeholder="2026 లో ఏ పార్టీ గెలుస్తుంది?"
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={question.required !== false}
            onChange={(e) => patch({ required: e.target.checked })}
            className="rounded border-gray-300"
          />
          Required question
        </label>

        {question.questionType === 'VIDEO_UPLOAD' ? (
          <FormField label="Max video length (seconds)">
            <Input
              type="number"
              min={5}
              max={120}
              value={question.videoMaxSeconds ?? 30}
              onChange={(e) => patch({ videoMaxSeconds: Number(e.target.value) || 30 })}
            />
          </FormField>
        ) : null}

        {hasAnswers ? (
          <div className="space-y-3 pt-3 border-t-2 border-brand/20 bg-amber-50/40 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-gray-900">Answers (member picks one)</p>
                <p className="text-xs text-gray-600 mt-0.5">Minimum 2 options required</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {surveyType === 'GENERAL' ? (
                  <Button size="sm" variant="secondary" type="button" onClick={loadPartiesIntoOptions}>
                    Load all parties
                  </Button>
                ) : null}
                {surveyType === 'POLITICAL_PARTY' && partyCode ? (
                  <Button size="sm" variant="secondary" type="button" onClick={addSelectedPartyAsOption}>
                    + {partyCode}
                  </Button>
                ) : null}
                <Button size="sm" type="button" onClick={addOption}>
                  + Add answer
                </Button>
              </div>
            </div>

            <ul className="space-y-2">
              {(question.options || []).map((opt, oi) => (
                <li
                  key={opt._key}
                  className="grid gap-2 sm:grid-cols-[100px_1fr_72px_auto] items-end p-3 rounded-lg bg-white border border-gray-200"
                >
                  <FormField label={oi === 0 ? 'ID' : ''}>
                    <Input
                      value={opt.id}
                      onChange={(e) => patchOption(opt._key, { id: e.target.value.toUpperCase() })}
                      placeholder="BJP"
                      className="font-mono text-xs"
                    />
                  </FormField>
                  <FormField label={oi === 0 ? 'Label (shown in app)' : ''}>
                    <Input
                      value={opt.label}
                      onChange={(e) => patchOption(opt._key, { label: e.target.value })}
                      placeholder="Bharatiya Janata Party"
                    />
                  </FormField>
                  <FormField label={oi === 0 ? 'Color' : ''}>
                    <input
                      type="color"
                      value={opt.color || '#888888'}
                      onChange={(e) => patchOption(opt._key, { color: e.target.value })}
                      className="w-full h-10 rounded border border-gray-200"
                    />
                  </FormField>
                  <button
                    type="button"
                    onClick={() => removeOption(opt._key)}
                    disabled={(question.options || []).length <= 2}
                    className="text-xs text-red-600 hover:underline pb-2 disabled:opacity-40"
                    title={(question.options || []).length <= 2 ? 'Need at least 2 answers' : 'Remove'}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {question.questionType === 'YES_NO' ? (
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            Member sees <strong>Yes</strong> / <strong>No</strong> — no separate answers to add.
          </p>
        ) : null}

        {question.questionType === 'TEXT' ? (
          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            Member types a short text answer — no preset answers.
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default function SurveyQuestionsBuilder({
  questions,
  onChange,
  surveyType,
  state,
  partyCode = '',
}) {
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  const setAt = (index, q) => {
    const next = [...questions]
    next[index] = q
    onChange(next)
  }

  const removeAt = (index) => {
    onChange(questions.filter((_, i) => i !== index))
  }

  const move = (index, dir) => {
    const j = index + dir
    if (j < 0 || j >= questions.length) return
    const next = [...questions]
    ;[next[index], next[j]] = [next[j], next[index]]
    onChange(next)
  }

  const addQuestion = (type) => {
    onChange([...questions, newQuestion(type, questions.length)])
  }

  const applyTemplate = () => {
    setLoadingTemplate(true)
    onChange(defaultQuestionsForSurveyType(surveyType))
    setLoadingTemplate(false)
    toast.success('Reset to 1 starter question (no video)')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
        <strong>Start with 1 question</strong> (Yes/No or Choice). Video is{' '}
        <strong>optional</strong> — enable in step 2 or click <span className="font-semibold">+ Video</span>{' '}
        only if members must record. Extra questions: use the buttons below.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-900">Survey questions</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {questions.length} question{questions.length === 1 ? '' : 's'} — members answer in order
          </p>
        </div>
        <Button size="sm" variant="secondary" type="button" onClick={applyTemplate} loading={loadingTemplate}>
          Reset template
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ADD_BUTTONS.map((b) => (
          <Button
            key={b.type}
            size="sm"
            variant={b.variant === 'primary' ? undefined : b.variant}
            type="button"
            onClick={() => addQuestion(b.type)}
          >
            {b.label}
          </Button>
        ))}
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-10 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-600 font-medium">No questions yet</p>
          <p className="text-xs text-gray-500 mt-1 mb-3">Start with a choice question to add answers</p>
          <Button className="mt-1" size="sm" onClick={() => addQuestion('SINGLE_CHOICE')}>
            + Choice (with answers)
          </Button>
        </div>
      ) : (
        <div className="space-y-4 pr-1">
          {questions.map((q, i) => (
            <QuestionCard
              key={q._key}
              question={q}
              index={i}
              total={questions.length}
              state={state}
              surveyType={surveyType}
              partyCode={partyCode}
              onChange={(updated) => setAt(i, updated)}
              onRemove={() => removeAt(i)}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
