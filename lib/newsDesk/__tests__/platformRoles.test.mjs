import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BACKEND_SYNDICATION_DESK_ROLES,
  canAccessNewsDesk,
  canAccessSyndication,
} from '../../syndication/platformRoles.js'

test('canAccessNewsDesk matches backend syndication desk roles only', () => {
  assert.deepEqual(BACKEND_SYNDICATION_DESK_ROLES, [
    'SUPER_ADMIN',
    'SUPERADMIN',
    'NEWS_MODERATOR',
    'NEWS_DESK',
    'NEWS_DESK_ADMIN',
  ])
  assert.equal(canAccessNewsDesk({ role: 'NEWS_DESK' }), true)
  assert.equal(canAccessNewsDesk({ role: 'NEWS_DESK_ADMIN' }), true)
  assert.equal(canAccessNewsDesk({ role: 'ADMIN' }), false)
  assert.equal(canAccessNewsDesk({ role: 'DESK_EDITOR' }), false)
  assert.equal(canAccessSyndication({ role: 'ADMIN' }), true)
  assert.equal(canAccessNewsDesk({ role: 'ADMIN' }), false)
})