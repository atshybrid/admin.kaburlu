import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveDeskQueueStage, filterRowsByDeskTab } from '../deskQueueStage.js'

test('deriveDeskQueueStage — extracting in queue', () => {
  const s = deriveDeskQueueStage({ extractionStatus: 'EXTRACTION_PENDING', targetTenants: [] })
  assert.equal(s.tab, 'queue')
  assert.equal(s.id, 'extracting')
})

test('deriveDeskQueueStage — ready to publish', () => {
  const s = deriveDeskQueueStage({
    extractionStatus: 'EXTRACTION_SUCCEEDED',
    syndicationStatus: 'DRAFT',
    targetTenants: [{ tenantId: 'a', published: false }],
  })
  assert.equal(s.tab, 'queue')
  assert.equal(s.id, 'ready')
})

test('deriveDeskQueueStage — published when live', () => {
  const s = deriveDeskQueueStage({
    extractionStatus: 'EXTRACTION_SUCCEEDED',
    syndicationStatus: 'DRAFT',
    targetTenants: [{ tenantId: 'a', published: true }],
  })
  assert.equal(s.tab, 'published')
})

test('filterRowsByDeskTab', () => {
  const rows = [
    { extractionStatus: 'EXTRACTION_PENDING', targetTenants: [] },
    {
      extractionStatus: 'EXTRACTION_SUCCEEDED',
      targetTenants: [{ published: true }],
    },
  ]
  assert.equal(filterRowsByDeskTab(rows, 'queue').length, 1)
  assert.equal(filterRowsByDeskTab(rows, 'published').length, 1)
})