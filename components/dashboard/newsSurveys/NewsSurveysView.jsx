/**
 * News Surveys — Super Admin
 * Create surveys, list all, view reporter video responses
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { newsSurveysApi } from '../../../lib/api/services/newsSurveysApi'
import {
  normalizeSurveyList,
  normalizeSubmissionList,
  formatSurveyDate,
  surveyStatusColor,
} from '../../../lib/newsSurveys/normalize'
import CreateNewsSurveyModal from './CreateNewsSurveyModal'
import NewsSurveyDetailPanel from './NewsSurveyDetailPanel'
import PartyChip from '../politicalParties/PartyChip'
import {
  Button,
  Input,
  Pagination,
  SlidePanel,
  Spinner,
  StatCard,
  StatusBadge,
  Tabs,
  toast,
} from '../../ui'
import { ApiError } from '../../../lib/api/client'

const PAGE_SIZE = 20

function formatErr(err, fb) {
  if (err instanceof ApiError) return err.data?.code ? `${err.message} (${err.data.code})` : err.message
  return err?.message || fb
}

function SubmissionsTable({ items, surveysById, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="text-center py-16 border border-dashed rounded-2xl bg-gray-50/50">
        <p className="text-gray-600 font-medium">No video responses yet</p>
        <p className="text-sm text-gray-500 mt-1">Reporter submissions appear here when surveys go live</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-3">Reporter</th>
            <th className="px-4 py-3">Survey</th>
            <th className="px-4 py-3">Answer</th>
            <th className="px-4 py-3">Video</th>
            <th className="px-4 py-3">Submitted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((sub) => {
            const survey = surveysById[sub.surveyId]
            const ans = survey?.answers?.find((a) => a.id === sub.selectedAnswerId)
            return (
              <tr key={sub.id} className="hover:bg-brand/[0.02]">
                <td className="px-4 py-3">
                  <span className="font-mono font-semibold text-gray-900">{sub.submitterMobile || '—'}</span>
                  {sub.tenantId ? (
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[140px]" title={sub.tenantId}>
                      {sub.tenantId}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 line-clamp-1">{sub.surveyTitle || survey?.title || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  {ans ? (
                    <span
                      className="inline-block text-xs font-medium px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: ans.color || '#64748b' }}
                    >
                      {ans.label}
                    </span>
                  ) : (
                    <span className="text-gray-500">{sub.selectedAnswerId || '—'}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {sub.videoUrl ? (
                    <a
                      href={sub.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand text-xs font-medium hover:underline"
                    >
                      Play video ↗
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {formatSurveyDate(sub.createdAt)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function NewsSurveysView() {
  const [tab, setTab] = useState('surveys')

  const [surveys, setSurveys] = useState([])
  const [surveyPage, setSurveyPage] = useState(1)
  const [surveyTotalPages, setSurveyTotalPages] = useState(1)
  const [surveyTotal, setSurveyTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [surveySearch, setSurveySearch] = useState('')
  const [surveysLoading, setSurveysLoading] = useState(false)

  const [submissions, setSubmissions] = useState([])
  const [subPage, setSubPage] = useState(1)
  const [subTotalPages, setSubTotalPages] = useState(1)
  const [subTotal, setSubTotal] = useState(0)
  const [subSurveyFilter, setSubSurveyFilter] = useState('')
  const [subsLoading, setSubsLoading] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const loadSurveys = useCallback(async () => {
    setSurveysLoading(true)
    try {
      const params = { page: String(surveyPage), pageSize: String(PAGE_SIZE) }
      if (statusFilter) params.status = statusFilter
      const raw = await newsSurveysApi.list(params)
      const parsed = normalizeSurveyList(raw)
      let items = parsed.items
      if (surveySearch.trim()) {
        const q = surveySearch.trim().toLowerCase()
        items = items.filter(
          (s) =>
            s.title?.toLowerCase().includes(q) ||
            s.question?.toLowerCase().includes(q)
        )
      }
      setSurveys(items)
      setSurveyTotal(parsed.pagination.total)
      setSurveyTotalPages(parsed.pagination.totalPages)
    } catch (err) {
      toast.error(formatErr(err, 'Failed to load surveys'))
      setSurveys([])
    } finally {
      setSurveysLoading(false)
    }
  }, [surveyPage, statusFilter, surveySearch])

  const loadSubmissions = useCallback(async () => {
    setSubsLoading(true)
    try {
      const params = { page: String(subPage), pageSize: String(PAGE_SIZE) }
      if (subSurveyFilter) params.surveyId = subSurveyFilter
      const raw = await newsSurveysApi.listAllSubmissions(params)
      const parsed = normalizeSubmissionList(raw)
      setSubmissions(parsed.items)
      setSubTotal(parsed.pagination.total)
      setSubTotalPages(parsed.pagination.totalPages)
    } catch (err) {
      toast.error(formatErr(err, 'Failed to load responses'))
      setSubmissions([])
    } finally {
      setSubsLoading(false)
    }
  }, [subPage, subSurveyFilter])

  useEffect(() => {
    loadSurveys()
  }, [loadSurveys])

  useEffect(() => {
    if (tab === 'responses') loadSubmissions()
  }, [tab, loadSubmissions])

  const surveysById = useMemo(
    () => Object.fromEntries(surveys.map((s) => [s.id, s])),
    [surveys]
  )

  const totalResponses = useMemo(
    () => surveys.reduce((n, s) => n + (s.responseCount || 0), 0),
    [surveys]
  )

  const openSurvey = (id) => {
    if (!id) return
    setSelectedId(id)
    setPanelOpen(true)
  }

  const tabs = [
    { key: 'surveys', label: 'All surveys', count: surveyTotal || undefined },
    { key: 'responses', label: 'Reporter responses', count: subTotal || undefined },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">News Surveys</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Create election polls for reporters — video responses with party-branded frames.
            Super Admin APIs: <code className="text-xs bg-gray-100 px-1 rounded">/admin/news-surveys</code>
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 shadow-sm">
          + Create survey
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Active surveys" value={surveys.filter((s) => s.status === 'ACTIVE').length} />
        <StatCard title="Total responses" value={totalResponses || subTotal} />
        <StatCard title="Listed surveys" value={surveyTotal} />
      </div>

      <Tabs tabs={tabs} defaultTab="surveys" onChange={setTab} variant="pills" />

      {tab === 'surveys' ? (
        <>
          <div className="flex flex-wrap gap-2">
            {['', 'ACTIVE', 'DRAFT', 'CLOSED'].map((s) => (
              <button
                key={s || 'all'}
                type="button"
                onClick={() => {
                  setStatusFilter(s)
                  setSurveyPage(1)
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === s ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {s || 'All status'}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setSurveyPage(1)
              loadSurveys()
            }}
          >
            <Input
              placeholder="Search title or question…"
              value={surveySearch}
              onChange={(e) => setSurveySearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
            <Button type="button" variant="ghost" onClick={loadSurveys} loading={surveysLoading}>
              Refresh
            </Button>
          </form>

          {surveysLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : surveys.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-2xl">
              <p className="text-gray-600 font-medium">No surveys yet</p>
              <Button className="mt-3" size="sm" onClick={() => setCreateOpen(true)}>
                Create first survey
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {surveys.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => openSurvey(s.id)}
                    className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-brand/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900 group-hover:text-brand">{s.title}</h3>
                          <StatusBadge label={s.status} color={surveyStatusColor(s.status)} />
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{s.question}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="font-medium text-brand">{s.responseCount ?? 0} responses</span>
                          <span>{formatSurveyDate(s.createdAt)}</span>
                          {s.tenant ? <span>{s.tenant.name}</span> : s.tenantId ? (
                            <span className="font-mono truncate max-w-[120px]">{s.tenantId}</span>
                          ) : (
                            <span>All tenants</span>
                          )}
                        </div>
                      </div>
                      {s.politicalParty ? (
                        <PartyChip party={s.politicalParty} size="sm" />
                      ) : s.frameImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.frameImageUrl}
                          alt=""
                          className="h-14 w-14 rounded-lg border object-cover bg-gray-50 shrink-0"
                        />
                      ) : null}
                    </div>
                    {(s.answers || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {s.answers.slice(0, 5).map((a) => (
                          <span
                            key={a.id}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: a.color || '#94a3b8' }}
                          >
                            {a.label}
                          </span>
                        ))}
                        {s.answers.length > 5 ? (
                          <span className="text-[10px] text-gray-400">+{s.answers.length - 5}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Pagination
            currentPage={surveyPage}
            totalPages={surveyTotalPages}
            onPageChange={setSurveyPage}
          />
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-sm text-gray-600">Filter by survey:</label>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white min-w-[200px]"
              value={subSurveyFilter}
              onChange={(e) => {
                setSubSurveyFilter(e.target.value)
                setSubPage(1)
              }}
            >
              <option value="">All surveys</option>
              {surveys.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <Button type="button" variant="ghost" size="sm" onClick={loadSurveys}>
              Reload survey list
            </Button>
            <Button type="button" variant="ghost" loading={subsLoading} onClick={loadSubmissions}>
              Refresh responses
            </Button>
          </div>

          <SubmissionsTable items={submissions} surveysById={surveysById} loading={subsLoading} />

          <Pagination currentPage={subPage} totalPages={subTotalPages} onPageChange={setSubPage} />
        </>
      )}

      <CreateNewsSurveyModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          loadSurveys()
          if (tab === 'responses') loadSubmissions()
        }}
      />

      <SlidePanel
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false)
          setSelectedId(null)
        }}
        title="Survey detail"
        width="lg"
      >
        {selectedId ? (
          <NewsSurveyDetailPanel
            surveyId={selectedId}
            onClose={() => {
              setPanelOpen(false)
              setSelectedId(null)
            }}
          />
        ) : null}
      </SlidePanel>
    </div>
  )
}
