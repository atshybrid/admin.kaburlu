import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildTenantsIntakePayload,
  defaultTenantSelection,
  DEFAULT_NEWS_DESK_TENANT_ID,
} from '../tenantIntake.js'

test('buildTenantsIntakePayload maps nativeName', () => {
  const rows = [
    { id: 't1', name: 'Kaburlu Today', nativeName: 'కబుర్లు టుడే' },
    { id: 't2', name: 'Print A', nativeName: 'ప్రింట్ A' },
  ]
  const out = buildTenantsIntakePayload(['t1', 't2'], rows)
  assert.deepEqual(out, [
    { tenantId: 't1', nativeName: 'కబుర్లు టుడే' },
    { tenantId: 't2', nativeName: 'ప్రింట్ A' },
  ])
})

test('defaultTenantSelection prefers short news id', () => {
  const id = DEFAULT_NEWS_DESK_TENANT_ID
  const rows = [{ id: 'other', name: 'X' }, { id, name: 'Kaburlu Today' }]
  assert.deepEqual(defaultTenantSelection(rows), [id])
})