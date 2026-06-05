import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { renderBlock08 } from './renderBlock08.js'
import { BLOCK_08A, BLOCK_08A_ENGINE_VERSION } from './constants.js'
import { getPool } from './db/pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 3097

app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use('/static', express.static(path.join(__dirname, '../public')))

app.get('/health', async (_req, res) => {
  let db = 'skipped'
  if (process.env.BLOCK08_SKIP_DB !== 'true' && process.env.DATABASE_URL) {
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
    service: 'block08-engine',
    block: BLOCK_08A.code,
    engineVersion: BLOCK_08A_ENGINE_VERSION,
    widthIn: BLOCK_08A.widthIn,
    columns: BLOCK_08A.columnCount,
    port: PORT,
    database: db,
  })
})

app.get('/', (_req, res) => {
  res.redirect('/static/demo.html')
})

app.post('/layout/block08/render', async (req, res) => {
  try {
    const result = await renderBlock08(req.body || {})
    res.status(result.valid ? 200 : 422).json(result)
  } catch (err) {
    console.error('[block08/render]', err)
    res.status(500).json({ valid: false, error: err.message || 'render failed' })
  }
})

const PREVIEW_DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
]

/** Same defaults as demo.html (2 images in col2 + col3). */
function previewArticleBody(req) {
  return {
    title: req.query.title || 'బ్లాక్-08A: మూడు నిలువు వరుసల లేఅవుట్',
    subtitle: req.query.subtitle || '8 అంగుళాల వెడల్పు',
    highlights: req.query.h1
      ? [req.query.h1, req.query.h2].filter(Boolean)
      : ['పథకాల అమలుపై సమీక్ష', 'పారదర్శకత హామీ'],
    image: [req.query.image || PREVIEW_DEFAULT_IMAGES[0], req.query.image2 || PREVIEW_DEFAULT_IMAGES[1]],
    content: req.query.content || buildSampleContent(260),
  }
}

app.get('/layout/block08/preview', async (req, res) => {
  try {
    const body = previewArticleBody(req)
    const debug = req.query.debug === '1' || req.query.debug === 'true'
    const result = await renderBlock08(
      { ...body, includeMeta: debug },
      { previewUrl: `http://localhost:${PORT}/layout/block08/preview` }
    )
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
  console.log(`BLOCK-08A engine → http://localhost:${PORT}`)
  console.log(`  Demo UI    → http://localhost:${PORT}/static/demo.html`)
  console.log(`  Preview    → http://localhost:${PORT}/layout/block08/preview`)
  console.log(`  API POST   → http://localhost:${PORT}/layout/block08/render`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\nPort ${PORT} is already in use (another block08-engine is running).\n` +
        `  Fix: lsof -ti :${PORT} | xargs kill -9\n` +
        `  Then: npm run dev\n`
    )
    process.exit(1)
  }
  throw err
})
