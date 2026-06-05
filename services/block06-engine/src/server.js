import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { renderBlock06 } from './renderBlock06.js'
import { BLOCK_06A, BLOCK_06A_ENGINE_VERSION } from './constants.js'
import { getPool } from './db/pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 3096

app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use('/static', express.static(path.join(__dirname, '../public')))

app.get('/health', async (_req, res) => {
  let db = 'skipped'
  if (process.env.BLOCK06_SKIP_DB !== 'true' && process.env.DATABASE_URL) {
    try {
      const p = getPool()
      await p.query('SELECT 1')
      db = 'ok'
    } catch (e) {
      db = `error: ${e.message}`
    }
  }
  res.json({
    ok: true,
    service: 'block06-engine',
    block: BLOCK_06A.code,
    engineVersion: BLOCK_06A_ENGINE_VERSION,
    port: PORT,
    database: db,
  })
})

app.get('/', (_req, res) => {
  res.redirect('/static/demo.html')
})

/**
 * POST /layout/block06/render
 * Body: { title, subtitle?, highlights?, image?, content }
 */
app.post('/layout/block06/render', async (req, res) => {
  try {
    const result = await renderBlock06(req.body || {})
    const status = result.valid ? 200 : 422
    res.status(status).json(result)
  } catch (err) {
    console.error('[block06/render]', err)
    res.status(500).json({
      valid: false,
      error: err.message || 'render failed',
    })
  }
})

/**
 * GET preview in browser (query params or defaults)
 */
app.get('/layout/block06/preview', async (req, res) => {
  try {
    const body = {
      title: req.query.title || 'బ్లాక్-06A డెమో శీర్షిక',
      subtitle: req.query.subtitle || 'జిల్లా కేంద్రంలో నిర్వహణ',
      highlights: req.query.h1
        ? [req.query.h1, req.query.h2].filter(Boolean)
        : ['మొదటి ముఖ్య అంశం', 'రెండవ ముఖ్య అంశం'],
      image:
        req.query.image ||
        'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
      content: req.query.content || buildSampleContent(200),
    }
    const debug = req.query.debug === '1' || req.query.debug === 'true'
    const result = await renderBlock06({ ...body, includeMeta: debug })
    if (result.previewHtml) {
      res.type('html').send(result.previewHtml)
      return
    }
    res.status(422).send(result.errors?.join('<br>') || 'Invalid')
  } catch (err) {
    res.status(500).send(err.message)
  }
})

function buildSampleContent(wordTarget) {
  const seed =
    'ఈ రోజు జరిగిన సమావేశంలో అధికారులు ప్రజా హితాలను ప్రాధాన్యతగా పరిగణించాలని నిర్ణయించారు. స్థానిక సమస్యలపై విస్తృత చర్చ జరిగింది. విద్య, ఆరోగ్యం, రోడ్ల అభివృద్ధి పై ప్రత్యేక దృష్టి సారించాలని సూచనలు వచ్చాయి. పారదర్శకత పాటిస్తూ పథకాలను అమలు చేయాలని అధికారులు హామీ ఇచ్చారు. ప్రజల నుండి సూచనలు స్వీకరించి త్వరలో నివేదిక సమర్పిస్తామని తెలిపారు. '
  let out = ''
  while (out.split(/\s+/).filter(Boolean).length < wordTarget) {
    out += seed
  }
  return out.split(/\s+/).slice(0, wordTarget).join(' ')
}

const server = app.listen(PORT, () => {
  console.log(`BLOCK-06A engine → http://localhost:${PORT}`)
  console.log(`  Demo UI    → http://localhost:${PORT}/static/demo.html`)
  console.log(`  Preview    → http://localhost:${PORT}/layout/block06/preview`)
  console.log(`  API POST   → http://localhost:${PORT}/layout/block06/render`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\nPort ${PORT} is already in use (another block06-engine is running).\n` +
        `  Fix: lsof -ti :${PORT} | xargs kill -9\n` +
        `  Then: npm run dev\n`
    )
    process.exit(1)
  }
  throw err
})
