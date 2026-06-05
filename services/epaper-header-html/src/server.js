import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  renderMainHeader,
  renderSubHeader,
  renderHeaderPair,
  generatePreviewDocument,
  ENGINE_VERSION,
  HEADER_SPECS,
} from './renderHeader.js'
import { DEFAULT_SETTINGS } from './constants.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 3099
const MEDIA_API =
  (process.env.MEDIA_API_URL || process.env.KABURLU_BACKEND_URL || 'https://api.kaburlumedia.com/api/v1').replace(
    /\/$/,
    '',
  )

app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use('/static', express.static(path.join(__dirname, '../public')))

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'epaper-header-html',
    engineVersion: ENGINE_VERSION,
    port: PORT,
    specs: HEADER_SPECS,
    mediaApi: MEDIA_API,
    urls: {
      demo: `http://localhost:${PORT}/static/demo.html`,
      catalog: `http://localhost:${PORT}/layout/epaper-header/catalog`,
      preview: `http://localhost:${PORT}/layout/epaper-header/preview`,
      renderMain: `http://localhost:${PORT}/layout/epaper-header/render/main`,
      renderSub: `http://localhost:${PORT}/layout/epaper-header/render/sub`,
      renderPair: `http://localhost:${PORT}/layout/epaper-header/render`,
    },
  })
})

/** Proxy canonical style names from media backend (no hardcoded demo list). */
app.get('/layout/epaper-header/catalog', async (_req, res) => {
  try {
    const upstream = await fetch(`${MEDIA_API}/public/epaper/header-styles`, {
      headers: { Accept: 'application/json' },
    })
    const data = await upstream.json()
    if (!upstream.ok) {
      return res.status(upstream.status).json(data)
    }
    res.set('Cache-Control', 'public, max-age=60')
    return res.json(data)
  } catch (e) {
    return res.status(503).json({ error: e.message, mediaApi: MEDIA_API })
  }
})

app.get('/', (_req, res) => res.redirect('/static/demo.html'))

app.post('/layout/epaper-header/render/main', (req, res) => {
  try {
    const result = renderMainHeader(req.body || {})
    res.json({ valid: true, ...result })
  } catch (e) {
    res.status(500).json({ valid: false, error: e.message })
  }
})

app.post('/layout/epaper-header/render/sub', (req, res) => {
  try {
    const result = renderSubHeader(req.body || {})
    res.json({ valid: true, ...result })
  } catch (e) {
    res.status(500).json({ valid: false, error: e.message })
  }
})

app.post('/layout/epaper-header/render', (req, res) => {
  try {
    const pair = renderHeaderPair(req.body || {})
    res.json({ valid: true, ...pair })
  } catch (e) {
    res.status(500).json({ valid: false, error: e.message })
  }
})

app.get('/layout/epaper-header/preview', (req, res) => {
  try {
    const body = {
      preset: req.query.preset || 'broadsheet',
      headerStyleNumber: Number(req.query.mainStyle) || 2,
      subHeaderStyleNumber: Number(req.query.subStyle) || 2,
      settings: {
        ...DEFAULT_SETTINGS,
        pageNumber: req.query.page || '2',
        headerLogoUrl: req.query.logo || '',
        subHeaderLogoUrl: req.query.subLogo || '',
      },
    }
    const pair = renderHeaderPair(body)
    const html = generatePreviewDocument(pair)
    res.set('Cache-Control', 'no-store')
    res.type('html').send(html)
  } catch (e) {
    res.status(500).send(e.message)
  }
})

app.listen(PORT, () => {
  console.log(`ePaper Header HTML → http://localhost:${PORT}`)
  console.log(`  Demo     → http://localhost:${PORT}/static/demo.html`)
  console.log(`  Preview  → http://localhost:${PORT}/layout/epaper-header/preview`)
  console.log(`  API      → POST /layout/epaper-header/render`)
})
