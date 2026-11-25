import assert from 'node:assert/strict'
import test from 'node:test'
import { mapNewsDeskDashboardStats } from '../analyticsMap.js'

test('mapNewsDeskDashboardStats reads extraction block', () => {
  const out = mapNewsDeskDashboardStats({
    analytics: {
      pipelineTotal: 120,
      extraction: { pendingApprox: 5, factsSucceeded: 80, queueDead: 2 },
    },
  })
  assert.deepEqual(out, { total: 120, pending: 5, ready: 80, failed: 2 })
})