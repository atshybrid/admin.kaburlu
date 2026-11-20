import assert from 'node:assert/strict'
import test from 'node:test'
import { isHttpImageUrl, normalizeImageUrlList } from '../imageUrl.js'

test('isHttpImageUrl accepts https', () => {
  assert.equal(isHttpImageUrl('https://cdn.example/a.jpg'), true)
  assert.equal(isHttpImageUrl('ftp://x'), false)
})

test('normalizeImageUrlList dedupes against existing', () => {
  const added = normalizeImageUrlList(['https://a/1.jpg', 'https://a/1.jpg', 'bad'], ['https://a/1.jpg'])
  assert.deepEqual(added, [])
  const fresh = normalizeImageUrlList(['https://a/2.jpg'], ['https://a/1.jpg'])
  assert.deepEqual(fresh, ['https://a/2.jpg'])
})