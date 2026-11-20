import assert from 'node:assert/strict'
import test from 'node:test'
import { buildNewsDeskListQuery } from '../listQuery.js'
import { formatNewsDeskError } from '../apiErrors.js'

test('buildNewsDeskListQuery maps list filters to query params', () => {
  const q = buildNewsDeskListQuery({
    page: 2,
    pageSize: 20,
    q: 'headline',
    pipelineStatus: 'EXTRACTION_PENDING',
    extractionStatus: 'EXTRACTION_SUCCEEDED',
    categoryId: 'cat-1',
    fromDate: '2026-01-01T00:00:00.000Z',
    toDate: '2026-01-31T23:59:59.000Z',
    sort: 'updatedAt',
    order: 'asc',
  })
  assert.equal(q.page, 2)
  assert.equal(q.pageSize, 20)
  assert.equal(q.q, 'headline')
  assert.equal(q.pipelineStatus, 'EXTRACTION_PENDING')
  assert.equal(q.extractionStatus, 'EXTRACTION_SUCCEEDED')
  assert.equal(q.categoryId, 'cat-1')
  assert.equal(q.sort, 'updatedAt')
  assert.equal(q.order, 'asc')
  assert.ok(q.fromDate)
  assert.ok(q.toDate)
})

test('buildNewsDeskListQuery omits empty optional fields', () => {
  const q = buildNewsDeskListQuery({ page: 1, pageSize: 20 })
  assert.equal(Object.keys(q).length, 2)
})

test('formatNewsDeskError maps backend codes', () => {
  assert.match(formatNewsDeskError({ code: 'EXTRACTION_IN_PROGRESS' }), /in progress/i)
  assert.match(formatNewsDeskError({ status: 403 }), /access denied/i)
})