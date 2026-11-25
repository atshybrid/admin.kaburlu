import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizePublishWebResponse, blockerLabel } from '../publishResultSummary.js'

test('summarizePublishWebResponse counts ok fail skip', () => {
  const s = summarizePublishWebResponse({
    partial: true,
    success: false,
    results: [
      { tenantId: 'a', ok: true, nativeName: 'A' },
      { tenantId: 'b', ok: true, skipped: true, code: 'TENANT_ALREADY_PUBLISHED' },
      { tenantId: 'c', ok: false, code: 'PUBLISH_FAILED', nativeName: 'C' },
    ],
  })
  assert.equal(s.publishedCount, 1)
  assert.equal(s.skippedCount, 1)
  assert.equal(s.failedCount, 1)
  assert.equal(s.lines.length, 3)
})

test('blockerLabel maps known codes', () => {
  assert.match(blockerLabel('NOT_APPROVED'), /approval/i)
})