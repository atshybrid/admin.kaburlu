/**
 * Create survey — GENERAL or POLITICAL_PARTY
 */

import { useState, useEffect } from 'react'
import { unionSurveysApi } from '../../../lib/api/services/unionSurveysApi'
import {
  defaultQuestionsForSurveyType,
  starterQuestionsForSurveyType,
  syncVideoQuestion,
  hasVideoQuestion,
  serializeQuestions,
  validateQuestions,
} from '../../../lib/unionSurveys/questionTypes'
import { statesApi } from '../../../lib/api/services/statesApi'
import { DEFAULT_UNION_NAME } from '../../../lib/journalist/unionConfig'
import PartySearchSelect from '../politicalParties/PartySearchSelect'
import { resolvePartyCode } from '../../../lib/politicalParties/resolvePartyCode'
import { resolvePartyForSurvey } from '../../../lib/politicalParties/resolvePartyForSurvey'
import { partyOptionLabel } from '../../../lib/politicalParties/normalize'
import SurveyQuestionsBuilder from './SurveyQuestionsBuilder'
import { Button, FormField, Input, Modal, toast } from '../../ui'
import ImageUpload from '../../ui/ImageUpload'
import { extractSurveyId, normalizeSurvey, normalizeSurveyList } from '../../../lib/unionSurveys/normalize'
import { ApiError } from '../../../lib/api/client'

async function resolveSurveyIdAfterCreate(res, { displayName, unionName }) {
  let id = extractSurveyId(res)
  if (id) return id
  try {
    const raw = await unionSurveysApi.list({
      page: '1',
      limit: '15',
      unionName,
      q: displayName,
    })
    const items = normalizeSurveyList(raw).items
    const match =
      items.find((s) => String(s.displayName || '').trim() === displayName.trim()) || items[0]
    return extractSurveyId(match) || match?.id || null
  } catch {
    return null
  }
}

function formatErr(err, fb) {
  if (err instanceof ApiError) return err.data?.code ? `${err.message} (${err.data.code})` : err.message
  return err?.message || fb
}

export default function CreateSurveyWizard({ isOpen, onClose, unionName, onCreated }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [stateOptions, setStateOptions] = useState([])
  const [questions, setQuestions] = useState([])
  const [form, setForm] = useState({
    surveyType: 'GENERAL',
    unionName: unionName || DEFAULT_UNION_NAME,
    state: 'Telangana',
    displayName: '',
    description: '',
    politicalPartyId: '',
    partyCode: '',
    selectedParty: null,
    primaryColor: '#1A237E',
    secondaryColor: '#FFFFFF',
    frameImageUrl: '',
    frameStyleKey: '',
    requiresReview: true,
    requiredForInsuranceType: '',
    includeVideoQuestion: false,
  })

  useEffect(() => {
    if (!isOpen) return
    setStep(1)
    setQuestions(starterQuestionsForSurveyType('GENERAL'))
    setForm((f) => ({
      ...f,
      unionName: unionName || DEFAULT_UNION_NAME,
      politicalPartyId: '',
      partyCode: '',
      selectedParty: null,
    }))
    statesApi
      .list()
      .then((list) => {
        const names = list.map((s) => s.name || s.stateName).filter(Boolean)
        setStateOptions(names)
        if (names.length) {
          const tg = names.find((n) => n.toLowerCase() === 'telangana')
          setForm((f) => ({ ...f, state: tg || names[0] || f.state }))
        }
      })
      .catch(() => setStateOptions(['Telangana', 'Andhra Pradesh', 'Karnataka']))
  }, [isOpen, unionName])

  const onSurveyTypeChange = (surveyType) => {
    setForm((f) => ({
      ...f,
      surveyType,
      politicalPartyId: '',
      partyCode: '',
      selectedParty: null,
      includeVideoQuestion: false,
    }))
    setQuestions(starterQuestionsForSurveyType(surveyType))
  }

  const setIncludeVideo = (includeVideoQuestion) => {
    setForm((f) => ({ ...f, includeVideoQuestion }))
    setQuestions((qs) => syncVideoQuestion(qs, includeVideoQuestion))
  }

  const onStateChange = (stateName) => {
    setForm((f) => ({
      ...f,
      state: stateName,
      politicalPartyId: '',
      partyCode: '',
      selectedParty: null,
    }))
  }

  const onPartyPick = (party) => {
    if (!party) return
    const code = resolvePartyCode(party)
    setForm((f) => ({
      ...f,
      politicalPartyId: party.id,
      partyCode: code,
      selectedParty: party,
      primaryColor: party.primaryColor || f.primaryColor,
      secondaryColor: party.secondaryColor || f.secondaryColor,
      requiredForInsuranceType: 'ACCIDENTAL',
    }))
    if (!code) {
      toast.error('This party has no valid code — pick another or fix it on Political Parties page')
    }
  }

  const goNext = () => {
    if (step === 1) {
      if (!form.displayName.trim()) {
        toast.error('Display name is required')
        return
      }
      if (!form.state?.trim()) {
        toast.error('State is required')
        return
      }
      if (form.surveyType === 'POLITICAL_PARTY') {
        if (!form.politicalPartyId?.trim()) {
          toast.error('Select a political party from the list')
          return
        }
        if (!resolvePartyCode(form.selectedParty) && !form.partyCode?.trim()) {
          toast.error('Selected party has no code (BJP, BRS, AIMIM). Re-select from dropdown.')
          return
        }
      }
    }
    if (step === 2) {
      setQuestions((qs) =>
        syncVideoQuestion(
          qs.length ? qs : starterQuestionsForSurveyType(form.surveyType),
          form.includeVideoQuestion
        )
      )
    }
    setStep((s) => s + 1)
  }

  const handleCreate = async () => {
    const qErr = validateQuestions(questions)
    if (qErr) {
      toast.error(qErr)
      return
    }
    setSaving(true)
    try {
      const body = {
        unionName: form.unionName.trim(),
        state: form.state.trim(),
        surveyType: form.surveyType,
        displayName: form.displayName.trim(),
        description: form.description.trim() || undefined,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        frameImageUrl: form.frameImageUrl.trim() || undefined,
        frameStyleKey: form.frameStyleKey.trim() || undefined,
        requiresReview: form.requiresReview,
        requiredForInsuranceType: form.requiredForInsuranceType || null,
        questions: serializeQuestions(questions),
      }
      if (form.surveyType === 'POLITICAL_PARTY') {
        const resolved = await resolvePartyForSurvey({
          selectedParty: form.selectedParty,
          politicalPartyId: form.politicalPartyId,
        })
        if (!resolved.ok) {
          toast.error(resolved.error)
          setSaving(false)
          return
        }
        body.politicalPartyId = resolved.politicalPartyId
        body.partyCode = resolved.partyCode
      }
      const res = await unionSurveysApi.create(body)
      const surveyId = await resolveSurveyIdAfterCreate(res, {
        displayName: body.displayName,
        unionName: body.unionName,
      })
      if (!surveyId) {
        toast.success('Survey saved — open from list and click Publish')
        onCreated?.(normalizeSurvey(res) || res)
        onClose()
        return
      }
      try {
        await unionSurveysApi.publish(surveyId)
      } catch (pubErr) {
        toast.warning(
          formatErr(pubErr, 'Created but publish failed — open survey and Publish manually')
        )
        onCreated?.({ ...(normalizeSurvey(res) || {}), id: surveyId, campaignStatus: 'DRAFT' })
        onClose()
        return
      }
      toast.success('Survey created and published (ACTIVE)')
      onCreated?.({ ...res, id: surveyId, campaignStatus: 'ACTIVE' })
      onClose()
    } catch (err) {
      toast.error(formatErr(err, 'Create failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      contentOverflow={step === 3 ? 'auto' : 'visible'}
      title={`Create survey — step ${step}/3`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {step > 1 ? (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>Back</Button>
          ) : null}
          {step < 3 ? (
            <Button onClick={goNext}>Next</Button>
          ) : (
            <Button loading={saving} onClick={handleCreate}>Create & publish</Button>
          )}
        </>
      }
    >
      {step === 1 ? (
        <div className="space-y-4">
          <FormField label="Survey type">
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={form.surveyType}
              onChange={(e) => onSurveyTypeChange(e.target.value)}
            >
              <option value="GENERAL">GENERAL — election / multi-party poll</option>
              <option value="POLITICAL_PARTY">POLITICAL_PARTY — ex-party member survey</option>
            </select>
          </FormField>
          <FormField label="Display name *">
            <Input
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="2026 Election Prediction"
            />
          </FormField>
          <FormField label="Union">
            <Input value={form.unionName} onChange={(e) => setForm((f) => ({ ...f, unionName: e.target.value }))} />
          </FormField>
          <FormField label="State *">
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
              value={form.state}
              onChange={(e) => onStateChange(e.target.value)}
            >
              {stateOptions.length === 0 ? (
                <option value={form.state}>{form.state}</option>
              ) : (
                stateOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">Party list & answer options use this state.</p>
          </FormField>
          {form.surveyType === 'POLITICAL_PARTY' ? (
            <FormField label="Political party *">
              <PartySearchSelect
                state={form.state}
                value={form.politicalPartyId}
                onChange={onPartyPick}
              />
              {form.partyCode ? (
                <p className="text-xs text-green-800 mt-1.5 bg-green-50 border border-green-100 rounded px-2 py-1.5">
                  Linked for API: <strong className="font-mono">{form.partyCode}</strong>
                  {form.selectedParty ? ` · ${partyOptionLabel(form.selectedParty)}` : ''}
                </p>
              ) : form.politicalPartyId ? (
                <p className="text-xs text-amber-800 mt-1">Party selected but code missing — pick again from list.</p>
              ) : null}
            </FormField>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Primary color">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                className="w-full h-10 rounded border"
              />
            </FormField>
            <FormField label="Secondary color">
              <input
                type="color"
                value={form.secondaryColor}
                onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                className="w-full h-10 rounded border"
              />
            </FormField>
          </div>
          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={form.includeVideoQuestion}
              onChange={(e) => setIncludeVideo(e.target.checked)}
              className="mt-1 rounded border-gray-300"
            />
            <span className="text-sm">
              <strong>Add video question</strong> (optional — not added by default)
              <span className="block text-xs text-gray-500 mt-0.5">
                Members record a short video with party frame. Without this, only your text/choice
                questions run.
              </span>
            </span>
          </label>
          {form.includeVideoQuestion ? (
            <FormField label="Frame image (video overlay)">
              <ImageUpload
                value={form.frameImageUrl}
                onChange={(url) => setForm((f) => ({ ...f, frameImageUrl: url || '' }))}
                folder="journalist-union/survey-frames"
                label="Upload frame image"
                maxSizeMB={8}
              />
              <Input
                value={form.frameImageUrl}
                onChange={(e) => setForm((f) => ({ ...f, frameImageUrl: e.target.value }))}
                placeholder="CDN URL (auto-filled after upload)"
                className="mt-2 text-xs font-mono"
              />
            </FormField>
          ) : null}
          <FormField label="Frame style key">
            <Input
              value={form.frameStyleKey}
              onChange={(e) => setForm((f) => ({ ...f, frameStyleKey: e.target.value }))}
              placeholder="FRAME_ELECTION_2026"
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.requiresReview}
              onChange={(e) => setForm((f) => ({ ...f, requiresReview: e.target.checked }))}
            />
            Requires admin review (video answers)
          </label>
          <FormField label="Required for insurance">
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={form.requiredForInsuranceType}
              onChange={(e) => setForm((f) => ({ ...f, requiredForInsuranceType: e.target.value }))}
            >
              <option value="">None</option>
              <option value="ACCIDENTAL">ACCIDENTAL</option>
              <option value="HEALTH">HEALTH</option>
            </select>
          </FormField>
        </div>
      ) : null}

      {step === 3 ? (
        <>
          {form.surveyType === 'POLITICAL_PARTY' && form.partyCode ? (
            <p className="text-xs text-gray-600 mb-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
              Ex-party survey for <strong className="font-mono">{form.partyCode}</strong>. Answer options
              (bjp, trs) are separate — use official codes: BJP, BRS (not TRS), INC, AIMIM.
            </p>
          ) : null}
          <SurveyQuestionsBuilder
            questions={questions}
            onChange={setQuestions}
            surveyType={form.surveyType}
            state={form.state}
            partyCode={form.partyCode}
          />
        </>
      ) : null}
    </Modal>
  )
}
