import assert from 'node:assert/strict'
import test from 'node:test'
import { refreshNewsDeskDashboard } from '../dashboardRefresh.js'

test('refreshNewsDeskDashboard runs stats and list loaders together', async () => {
  const calls = []
  await refreshNewsDeskDashboard({
    loadStats: async () => { calls.push('stats') },
    loadList: async () => { calls.push('list') },
  })
  assert.deepEqual(calls.sort(), ['list', 'stats'])
})