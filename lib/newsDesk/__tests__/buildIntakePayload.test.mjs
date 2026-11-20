import assert from 'node:assert/strict'
import test from 'node:test'
import { buildNewsDeskIntakePayload, assertV2CreateResponse } from '../buildIntakePayload.js'

test('buildNewsDeskIntakePayload sets V2 flag and omits autoGenerate', () => {
  const payload = buildNewsDeskIntakePayload({
    rawText: ' Hello ',
    headline: 'Title',
    categoryId: 'cat1',
    sourceUrl: 'https://example.com/a',
    sourceAttribution: { type: 'DESK' },
    locationHint: 'Hyderabad',
    languageCode: 'te',
    imageUrls: ['https://cdn/a.jpg', 'https://cdn/b.jpg'],
  })
  assert.equal(payload.rawText, 'Hello')
  assert.deepEqual(payload.category, { categoryId: 'cat1' })
  assert.equal(payload.options.newsDeskPipelineV2, true)
  assert.equal(payload.options.autoGenerate, undefined)
  assert.deepEqual(payload.tenants, [])
  assert.deepEqual(payload.images, ['https://cdn/a.jpg', 'https://cdn/b.jpg'])
  assert.deepEqual(payload.locationHint, { note: 'Hyderabad' })
})

test('buildNewsDeskIntakePayload passes category object with name', () => {
  const payload = buildNewsDeskIntakePayload({
    rawText: 'Body',
    category: { categoryId: 'id1', categoryName: 'Politics' },
    imageUrls: [],
  })
  assert.deepEqual(payload.category, { categoryId: 'id1', categoryName: 'Politics' })
})

test('buildNewsDeskIntakePayload accepts structured locationHint', () => {
  const payload = buildNewsDeskIntakePayload({
    rawText: 'Body',
    categoryId: 'cat1',
    locationHint: { district: 'Hyderabad', mandal: 'Charminar', area: 'Bangaru Peta' },
    imageUrls: [],
  })
  assert.deepEqual(payload.locationHint, {
    district: 'Hyderabad',
    mandal: 'Charminar',
    area: 'Bangaru Peta',
  })
})

test('assertV2CreateResponse requires pipeline summary', () => {
  const ok = assertV2CreateResponse({ job: { jobId: 'j1' }, pipeline: { id: 'p1' } })
  assert.equal(ok.ok, true)
  assert.equal(ok.jobId, 'j1')

  const bad = assertV2CreateResponse({ job: { jobId: 'j2' } })
  assert.equal(bad.ok, false)
  assert.equal(bad.reason, 'V2_NOT_ACTIVE')
})