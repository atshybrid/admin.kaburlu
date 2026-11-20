import assert from 'node:assert/strict'
import test from 'node:test'
import { buildLocationHintFromFields, formatLocationHintDisplay } from '../locationHint.js'

test('location hint fields match V2 sample shape', () => {
  const hint = buildLocationHintFromFields({
    district: 'Hyderabad',
    mandal: 'Charminar',
    area: 'Bangaru Peta',
  })
  assert.deepEqual(hint, {
    district: 'Hyderabad',
    mandal: 'Charminar',
    area: 'Bangaru Peta',
  })
  assert.equal(formatLocationHintDisplay(hint), 'Hyderabad · Charminar · Bangaru Peta')
})