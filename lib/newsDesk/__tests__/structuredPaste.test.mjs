import assert from 'node:assert/strict'
import test from 'node:test'
import {
  looksLikeStructuredNewsDeskPaste,
  parseLocationLine,
  parseStructuredNewsDeskPaste,
  validateDeskBriefForApply,
} from '../structuredPaste.js'

const SAMPLE = `Headline:

కడప జడ్పీ పీఠం దక్కకపోవడంపై ఆదినారాయణరెడ్డి అసంతృప్తి.. రేపే తుది నిర్ణయం!

Article:

కడప జిల్లా పరిషత్ చైర్మన్ పదవి కేటాయింపు వ్యవహారం అధికార కూటమిలో రాజకీయ వేడిని పెంచుతోంది.

Category:

ఆంధ్రప్రదేశ్ రాజకీయాలు

Location:

కడప జిల్లా, ఆంధ్రప్రదేశ్

Source Name:

AP7AM

Source URL:

https://www.ap7am.com/tn/887422/kadapa-zp-post-row-adinarayana-reddy-to-announce-key-decision-tomorrow

Images:

Original Source Image
`

test('looksLikeStructuredNewsDeskPaste detects label blocks', () => {
  assert.equal(looksLikeStructuredNewsDeskPaste(SAMPLE), true)
  assert.equal(looksLikeStructuredNewsDeskPaste('plain telugu text only'), false)
  assert.equal(looksLikeStructuredNewsDeskPaste('Headline:\n\nArticle:\n\nCategory:\n'), false)
})

test('validateDeskBriefForApply rejects labels-only paste', () => {
  const bad = parseStructuredNewsDeskPaste('Headline:\n\nArticle:\n\nCategory:\n\nLocation:\n')
  assert.equal(validateDeskBriefForApply(bad).ok, false)
  assert.equal(validateDeskBriefForApply(parseStructuredNewsDeskPaste(SAMPLE)).ok, true)
})

test('parseStructuredNewsDeskPaste splits user sample', () => {
  const p = parseStructuredNewsDeskPaste(SAMPLE)
  assert.match(p.headline, /కడప జడ్పీ/)
  assert.match(p.article, /పరిషత్/)
  assert.equal(p.categoryName, 'ఆంధ్రప్రదేశ్ రాజకీయాలు')
  assert.equal(p.sourceName, 'AP7AM')
  assert.match(p.sourceUrl, /ap7am\.com/)
  assert.equal(p.wantsSourceLeadImage, true)
  assert.deepEqual(p.location, { district: 'కడప జిల్లా', note: 'ఆంధ్రప్రదేశ్' })
})

test('parseLocationLine splits comma-separated hint', () => {
  assert.deepEqual(parseLocationLine('Hyderabad, Telangana'), {
    district: 'Hyderabad',
    note: 'Telangana',
  })
})

const MARKDOWN_SAMPLE = `**Headline:**
కడప జడ్పీ పీఠం దక్కకపోవడంపై ఆదినారాయణరెడ్డి అసంతృప్తి

**Article:**
కడప జిల్లా పరిషత్ చైర్మన్ పదవి కేటాయింపు వ్యవహారం అధికార కూటమిలో రాజకీయ వేడిని పెంచుతోంది.

**Category:**
ఆంధ్రప్రదేశ్ రాజకీయాలు

**Location:**
కడప జిల్లా, ఆంధ్రప్రదేశ్

**Source Name:**
AP7AM

**Source URL:**
[https://www.ap7am.com/tn/887422/kadapa-zp-post-row]

**Images:**
[Original Source Image](https://www.ap7am.com/sample-lead.jpg)
`

test('looksLikeStructuredNewsDeskPaste accepts ChatGPT markdown labels', () => {
  assert.equal(looksLikeStructuredNewsDeskPaste(MARKDOWN_SAMPLE), true)
})

test('parseStructuredNewsDeskPaste handles markdown and bracket URLs', () => {
  const p = parseStructuredNewsDeskPaste(MARKDOWN_SAMPLE)
  assert.match(p.headline, /కడప జడ్పీ/)
  assert.match(p.article, /పరిషత్/)
  assert.equal(p.sourceName, 'AP7AM')
  assert.match(p.sourceUrl, /ap7am\.com\/tn/)
  assert.ok(p.imageUrls.some((u) => u.includes('sample-lead.jpg')))
})

test('parseStructuredNewsDeskPaste collects image URLs', () => {
  const p = parseStructuredNewsDeskPaste(`Article:

Body text here

Images:

https://cdn.example/a.jpg
https://cdn.example/b.png
`)
  assert.deepEqual(p.imageUrls, ['https://cdn.example/a.jpg', 'https://cdn.example/b.png'])
})