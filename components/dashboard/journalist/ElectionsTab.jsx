/**
 * DJFW Elections — STATE / DISTRICT / MANDAL readiness + conduct
 */

import { useState, useCallback } from 'react'
import { journalistApi } from '../../../lib/api/services/journalistApi'
import { electionReadiness, formatDjfwError } from '../../../lib/journalist/djfwNormalize'
import { DEFAULT_UNION_NAME } from '../../../lib/journalist/unionConfig'
import { useUnionSettings } from './useUnionSettings'
import ElectionLocationPicker, { EMPTY_ELECTION_LOCATION } from './ElectionLocationPicker'
import { MemberWinnerPicker } from './MemberSearchSelect'
import {
  Button,
  FormField,
  Input,
  Modal,
  StatusBadge,
  Spinner,
  toast,
} from '../../ui'
import { ApiError } from '../../../lib/api/client'

const LEVELS = [
  { id: 'STATE', label: 'State' },
  { id: 'DISTRICT', label: 'District' },
  { id: 'MANDAL', label: 'Mandal' },
]

function PostElectionCard({ post, onConduct }) {
  const vacant = post.seatsVacant > 0 || post.electionRequired
  return (
    <article
      className={`rounded-xl border p-4 bg-white transition-shadow ${
        vacant ? 'border-amber-200 hover:shadow-md' : 'border-gray-200'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{post.title}</h3>
          {post.nativeTitle ? (
            <p className="text-sm text-gray-500 mt-0.5">{post.nativeTitle}</p>
          ) : null}
        </div>
        <StatusBadge
          label={vacant ? 'Election needed' : 'Filled'}
          color={vacant ? 'yellow' : 'green'}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
          {post.level}
        </span>
        <span className="text-gray-500">
          Seats {post.seatsFilled ?? 0}/{post.maxSeats ?? 1}
        </span>
      </div>

      {vacant ? (
        <Button size="sm" className="mt-4 w-full" onClick={() => onConduct(post)}>
          Conduct election
        </Button>
      ) : (
        <p className="mt-3 text-xs text-green-700">Post is filled — no action needed</p>
      )}
    </article>
  )
}

function locationLabel(loc) {
  const parts = [loc.stateName, loc.districtName, loc.mandalName].filter(Boolean)
  return parts.join(' · ') || '—'
}

function validateLocation(level, loc) {
  if (level === 'STATE' && !loc.stateId) return 'Select a state'
  if (level === 'DISTRICT' && !loc.districtId) return 'Select state and district'
  if (level === 'MANDAL' && (!loc.districtId || !loc.mandalId)) return 'Select state, district, and mandal'
  return null
}

export default function ElectionsTab() {
  const { unionName } = useUnionSettings()
  const resolvedUnion = unionName || DEFAULT_UNION_NAME

  const [level, setLevel] = useState('DISTRICT')
  const [location, setLocation] = useState(EMPTY_ELECTION_LOCATION)

  const [readiness, setReadiness] = useState(null)
  const [loading, setLoading] = useState(false)

  const [conductPost, setConductPost] = useState(null)
  const [winners, setWinners] = useState([])
  const [conductForm, setConductForm] = useState({
    termStartDate: '',
    termEndDate: '',
    notes: '',
  })
  const [conducting, setConducting] = useState(false)

  const loadReadiness = useCallback(async () => {
    const err = validateLocation(level, location)
    if (err) {
      toast.error(err)
      return
    }

    setLoading(true)
    try {
      const params = {
        level,
        unionName: resolvedUnion,
        ...(location.stateId ? { stateId: location.stateId } : {}),
        ...(location.districtId ? { districtId: location.districtId } : {}),
        ...(location.mandalId ? { mandalId: location.mandalId } : {}),
      }
      const raw = await journalistApi.getElectionReadiness(params)
      setReadiness(electionReadiness(raw))
    } catch (err) {
      const msg = err instanceof ApiError ? formatDjfwError(err) : err?.message
      toast.error(msg || 'Failed to load election readiness')
      setReadiness(null)
    } finally {
      setLoading(false)
    }
  }, [level, location, resolvedUnion])

  const openConduct = (post) => {
    setConductPost(post)
    setWinners([])
    setConductForm({
      termStartDate: new Date().toISOString().slice(0, 10),
      termEndDate: '',
      notes: '',
    })
  }

  const handleConduct = async () => {
    if (!conductPost) return
    const maxSeats = conductPost.maxSeats ?? 1
    if (!winners.length) {
      toast.error('Select at least one winner')
      return
    }
    if (winners.length > maxSeats) {
      toast.error(`This post allows maximum ${maxSeats} winner(s)`)
      return
    }
    if (!conductForm.termStartDate) {
      toast.error('Term start date is required')
      return
    }

    setConducting(true)
    try {
      await journalistApi.conductElection({
        level,
        postId: conductPost.postId || conductPost.id,
        winnerProfileIds: winners.map((w) => w.id),
        termStartDate: conductForm.termStartDate,
        ...(conductForm.termEndDate ? { termEndDate: conductForm.termEndDate } : {}),
        ...(location.stateId ? { stateId: location.stateId } : {}),
        ...(location.districtId ? { districtId: location.districtId } : {}),
        ...(location.mandalId ? { mandalId: location.mandalId } : {}),
        ...(conductForm.notes.trim() ? { notes: conductForm.notes.trim() } : {}),
      })
      toast.success('Election conducted — winners appointed')
      setConductPost(null)
      loadReadiness()
    } catch (err) {
      const msg = err instanceof ApiError ? formatDjfwError(err) : err?.message
      toast.error(msg || 'Conduct failed')
    } finally {
      setConducting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-900">
        <strong>Why elections?</strong> Pick state / district / mandal from locations API → check which
        ELECTED posts need filling → search and select approved members as winners.
      </div>

      <div className="flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => {
              setLevel(l.id)
              setLocation(EMPTY_ELECTION_LOCATION)
              setReadiness(null)
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              level === l.id ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
        <ElectionLocationPicker level={level} value={location} onChange={setLocation} />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={loadReadiness} loading={loading}>
            Check readiness
          </Button>
          {location.stateName || location.districtName || location.mandalName ? (
            <p className="text-sm text-slate-600">
              Selected: <strong>{locationLabel(location)}</strong>
            </p>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : readiness ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-white px-4 py-3">
              <p className="text-2xl font-bold text-gray-900">{readiness.totalPosts}</p>
              <p className="text-xs text-gray-500">Total posts</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-2xl font-bold text-amber-900">{readiness.needElection}</p>
              <p className="text-xs text-amber-800">Need election</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-2xl font-bold text-green-900">{readiness.ready}</p>
              <p className="text-xs text-green-800">Ready / filled</p>
            </div>
          </div>

          {readiness.posts.length === 0 ? (
            <p className="text-center text-gray-500 py-12 border border-dashed rounded-xl">
              No posts returned — seed defaults in Committee tab first
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readiness.posts.map((post) => (
                <PostElectionCard
                  key={post.postId || post.id}
                  post={post}
                  onConduct={openConduct}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-gray-500 py-12">
          Select level and location, then check readiness
        </p>
      )}

      <Modal
        isOpen={Boolean(conductPost)}
        onClose={() => setConductPost(null)}
        title={conductPost ? `Conduct: ${conductPost.title}` : 'Conduct election'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConductPost(null)}>
              Cancel
            </Button>
            <Button loading={conducting} onClick={handleConduct}>
              Appoint winners
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Location: <strong>{locationLabel(location)}</strong>
          </p>

          <MemberWinnerPicker
            winners={winners}
            onChange={setWinners}
            maxSeats={conductPost?.maxSeats ?? 1}
            unionName={resolvedUnion}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Term start *">
              <Input
                type="date"
                value={conductForm.termStartDate}
                onChange={(e) =>
                  setConductForm((f) => ({ ...f, termStartDate: e.target.value }))
                }
              />
            </FormField>
            <FormField label="Term end">
              <Input
                type="date"
                value={conductForm.termEndDate}
                onChange={(e) =>
                  setConductForm((f) => ({ ...f, termEndDate: e.target.value }))
                }
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <Input
              value={conductForm.notes}
              onChange={(e) => setConductForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Elected at district AGM 2026"
            />
          </FormField>
        </div>
      </Modal>
    </div>
  )
}
