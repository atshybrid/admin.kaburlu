/**
 * Political / Union Surveys — Super Admin & Union Moderator
 */

import { useState, useEffect, useCallback } from 'react'
import { useLayout } from '../DashboardLayout'
import { canAccessJournalistUnion } from '../../../utils/roleUtils'
import { unionSurveysApi } from '../../../lib/api/services/unionSurveysApi'
import {
  extractSurveyId,
  normalizeSurvey,
  normalizeSurveyList,
  surveyTitle,
  surveyStatusColor,
} from '../../../lib/unionSurveys/normalize'
import { DEFAULT_UNION_NAME } from '../../../lib/journalist/unionConfig'
import { useUnionSettings } from '../journalist/useUnionSettings'
import CreateSurveyWizard from './CreateSurveyWizard'
import SurveyDetailPanel from './SurveyDetailPanel'
import { Button, Input, SlidePanel, Spinner, StatusBadge, toast } from '../../ui'
import { ApiError } from '../../../lib/api/client'

function formatErr(err, fb) {
  if (err instanceof ApiError) return err.data?.code ? `${err.message} (${err.data.code})` : err.message
  return err?.message || fb
}

export default function UnionSurveysView() {
  const { user } = useLayout()
  const { unionName } = useUnionSettings()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: '1', limit: '50', unionName: unionName || DEFAULT_UNION_NAME }
      if (statusFilter) params.campaignStatus = statusFilter
      if (typeFilter) params.surveyType = typeFilter
      if (search.trim()) params.q = search.trim()
      const raw = await unionSurveysApi.list(params)
      setItems(normalizeSurveyList(raw).items)
    } catch (err) {
      toast.error(formatErr(err, 'Failed to load surveys'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [unionName, statusFilter, typeFilter, search])

  useEffect(() => {
    load()
  }, [load])

  const openSurvey = (s) => {
    const id = extractSurveyId(s)
    if (!id) {
      toast.error('Survey id missing in list — refresh page')
      return
    }
    setSelectedId(id)
    setPanelOpen(true)
  }

  const selected = items.find((s) => extractSurveyId(s) === selectedId)

  if (!canAccessJournalistUnion(user)) {
    return (
      <div className="max-w-lg mx-auto mt-16 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-rose-900">Access denied</h2>
        <p className="text-sm text-rose-700 mt-2">Union surveys require Super Admin or Union Moderator access.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Political Surveys</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Union survey campaigns — GENERAL election polls & party-specific (Ex-BJP) flows. DRAFT → ACTIVE →
            assign → review → report.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 shadow-sm">
          + Create survey
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        {['', 'DRAFT', 'ACTIVE', 'CLOSED'].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              statusFilter === s ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {s || 'All status'}
          </button>
        ))}
        {['', 'GENERAL', 'POLITICAL_PARTY'].map((t) => (
          <button
            key={t || 'types'}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              typeFilter === t ? 'bg-slate-800 text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {t || 'All types'}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          load()
        }}
      >
        <Input
          placeholder="Search surveys…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
        <Button type="button" variant="ghost" onClick={load} loading={loading}>
          Refresh
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <p className="text-gray-600 font-medium">No surveys yet</p>
          <Button className="mt-3" size="sm" onClick={() => setCreateOpen(true)}>
            Create first survey
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => {
            const id = extractSurveyId(s)
            const st = s.campaignStatus || s.status
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => openSurvey(s)}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md hover:border-brand/30 transition-all"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{surveyTitle(s)}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {s.unionName} · {s.state || 'All states'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusBadge label={st || 'DRAFT'} color={surveyStatusColor(st)} />
                      <StatusBadge label={s.surveyType || 'GENERAL'} color="blue" />
                    </div>
                  </div>
                  <div
                    className="mt-3 h-1.5 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${s.primaryColor || '#1e3a5f'}, ${s.secondaryColor || '#eee'})`,
                    }}
                  />
                  <p className="text-xs text-brand mt-2 font-medium">Manage publish · assign · review →</p>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <SlidePanel
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false)
          setSelectedId(null)
        }}
        title="Survey campaign"
        subtitle={surveyTitle(selected || {})}
        width="xl"
      >
        {selectedId ? <SurveyDetailPanel surveyId={selectedId} onUpdated={load} /> : null}
      </SlidePanel>

      {createOpen ? (
        <CreateSurveyWizard
          isOpen
          onClose={() => setCreateOpen(false)}
          unionName={unionName}
          onCreated={(res) => {
            load()
            setCreateOpen(false)
            const id = extractSurveyId(res) || normalizeSurvey(res)?.id
            if (id) {
              setSelectedId(id)
              setPanelOpen(true)
            }
          }}
        />
      ) : null}
    </div>
  )
}
