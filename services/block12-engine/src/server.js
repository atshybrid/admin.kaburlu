import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { renderBlock12 } from './renderBlock12.js'
import { BLOCK_12A, BLOCK_12A_ENGINE_VERSION } from './constants.js'
import { getPool } from './db/pool.js'
import { SAMPLE_IMAGE_URLS } from './sampleImages.js'

export { SAMPLE_IMAGE_URLS }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 3098

app.use(cors())
app.use(express.json({ limit: '4mb' }))
app.use('/static', express.static(path.join(__dirname, '../public')))

app.get('/health', async (_req, res) => {
  let db = 'skipped'
  if (process.env.BLOCK12_SKIP_DB !== 'true' && process.env.DATABASE_URL) {
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
    service: 'block12-engine',
    block: BLOCK_12A.code,
    engineVersion: BLOCK_12A_ENGINE_VERSION,
    widthIn: BLOCK_12A.widthIn,
    maxHeightIn: BLOCK_12A.maxHeightIn,
    columns: BLOCK_12A.columnCount,
    maxImages: BLOCK_12A.maxImages,
    port: PORT,
    database: db,
    urls: {
      demo: `http://localhost:${PORT}/static/demo.html`,
      preview: `http://localhost:${PORT}/layout/block12/preview`,
      render: `http://localhost:${PORT}/layout/block12/render`,
    },
  })
})

app.get('/', (_req, res) => {
  res.redirect('/static/demo.html')
})

app.post('/layout/block12/render', async (req, res) => {
  try {
    const result = await renderBlock12(req.body || {}, {
      previewUrl: `http://localhost:${PORT}/layout/block12/preview`,
    })
    res.status(result.valid ? 200 : 422).json(result)
  } catch (err) {
    console.error('[block12/render]', err)
    res.status(500).json({ valid: false, error: err.message || 'render failed' })
  }
})

function previewArticleBody(req) {
  const imgQuery = req.query.images
  let images = SAMPLE_IMAGE_URLS
  if (imgQuery) {
    images = String(imgQuery)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 16)
  }
  return {
    title: req.query.title || 'బ్లాక్-12A: నాలుగు నిలువు వరుసలు · 12 అంగుళాల వెడల్పు',
    subtitle: req.query.subtitle || 'గరిష్ట ఎత్తు 21 అంగుళాలు · దిగువ గ్యాలరీ',
    highlights: req.query.h1
      ? [req.query.h1, req.query.h2, req.query.h3, req.query.h4].filter(Boolean)
      : ['పథకాల అమలు', 'పారదర్శకత', 'ప్రజా సంబంధాలు', 'అభివృద్ధి'],
    image: images,
    content: req.query.content || buildSampleContent(420),
  }
}

app.get('/layout/block12/img', async (req, res) => {
  try {
    const u = String(req.query.u || '').trim()
    if (!u || !/^https?:\/\//i.test(u)) {
      res.status(400).send('invalid url')
      return
    }
    const upstream = await fetch(u, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; block12-engine/1.0)',
        Accept: 'image/*,*/*',
      },
      redirect: 'follow',
    })
    if (!upstream.ok) {
      res.status(502).send(`upstream ${upstream.status}`)
      return
    }
    const ct = upstream.headers.get('content-type') || 'image/jpeg'
    res.set('Content-Type', ct)
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(Buffer.from(await upstream.arrayBuffer()))
  } catch (err) {
    console.error('[block12/img]', err.message)
    res.status(502).send('proxy failed')
  }
})

app.get('/layout/block12/sample', (_req, res) => {
  res.json({
    block: 'BLOCK-12A',
    title: 'బ్లాక్-12A: నాలుగు నిలువు వరుసల లేఅవుట్',
    subtitle: '12 అంగుళాల వెడల్పు · గరిష్ట 21 అంగుళాల ఎత్తు',
    highlights: ['పథకాల అమలు', 'పారదర్శకత', 'ప్రజా సంబంధాలు', 'అభివృద్ధి'],
    image: SAMPLE_IMAGE_URLS,
    content: buildSampleContent(420),
    urls: {
      demo: `http://localhost:${PORT}/static/demo.html`,
      preview: `http://localhost:${PORT}/layout/block12/preview`,
    },
  })
})

app.get('/layout/block12/preview', async (req, res) => {
  try {
    const body = previewArticleBody(req)
    const debug = req.query.debug === '1' || req.query.debug === 'true'
    const result = await renderBlock12(
      { ...body, includeMeta: debug },
      { previewUrl: `http://localhost:${PORT}/layout/block12/preview` }
    )
    if (result.previewHtml) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
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
    'ఈ రోజు జరిగిన విస్తృత సమావేశంలో అధికారులు ప్రజా హితాలను ప్రాధాన్యతగా పరిగణించాలని నిర్ణయించారు. స్థానిక సమస్యలపై చర్చ జరిగింది. విద్య, ఆరోగ్యం, రోడ్లు, నీటి సరఫరా పై దృష్టి సారించాలని సూచనలు వచ్చాయి. పారదర్శకత పాటిస్తూ పథకాలను అమలు చేయాలని హామీ ఇచ్చారు. ప్రజల సూచనలు స్వీకరించి నివేదిక సమర్పిస్తామని తెలిపారు. జిల్లా స్థాయిలో కార్యక్రమాలు వేగవంతం చేయాలని నిర్ణయించారు. '
  let out = ''
  while (out.split(/\s+/).filter(Boolean).length < wordTarget) {
    out += seed
  }
  return out.split(/\s+/).slice(0, wordTarget).join(' ')
}

const server = app.listen(PORT, () => {
  console.log(`BLOCK-12A engine → http://localhost:${PORT}`)
  console.log(`  Demo       → http://localhost:${PORT}/static/demo.html`)
  console.log(`  Preview    → http://localhost:${PORT}/layout/block12/preview`)
  console.log(`  API POST   → http://localhost:${PORT}/layout/block12/render`)
  console.log(`  Health     → http://localhost:${PORT}/health`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} in use. Fix: lsof -ti :${PORT} | xargs kill -9\n`)
    process.exit(1)
  }
  throw err
})
