import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isTerminalExtractionStatus,
  shouldPollExtraction,
} from '../extractionPolling.js'

test('terminal extraction statuses stop polling', () => {
  assert.equal(isTerminalExtractionStatus('EXTRACTION_SUCCEEDED'), true)
  assert.equal(isTerminalExtractionStatus('EXTRACTION_FAILED'), true)
  assert.equal(isTerminalExtractionStatus('EXTRACTION_PENDING'), false)
  assert.equal(shouldPollExtraction('EXTRACTION_PENDING'), true)
  assert.equal(shouldPollExtraction('RAW_ACCEPTED'), true)
  assert.equal(shouldPollExtraction('EXTRACTION_SUCCEEDED'), false)
  assert.equal(shouldPollExtraction(null), false)
})