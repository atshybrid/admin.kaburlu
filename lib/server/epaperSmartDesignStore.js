import fs from 'fs'
import path from 'path'
import { mainStyleKey, subStyleKey } from '../epaper/headerStyleCatalog'
import { fetchPublicHeaderStylesCatalog } from './fetchHeaderStylesCatalog'

const DATA_DIR = path.join(process.cwd(), '.data', 'epaper-smart-design')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function tenantFile(tenantId) {
  return path.join(DATA_DIR, `${String(tenantId).replace(/[^a-zA-Z0-9_-]/g, '_')}.json`)
}

function readTenantDoc(tenantId) {
  ensureDir()
  const file = tenantFile(tenantId)
  if (!fs.existsSync(file)) {
    return { tenantId: String(tenantId), designs: [], meta: {} }
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return { tenantId: String(tenantId), designs: [], meta: {} }
  }
}

function writeTenantDoc(tenantId, doc) {
  ensureDir()
  fs.writeFileSync(tenantFile(tenantId), JSON.stringify(doc, null, 2), 'utf8')
}

function newId() {
  return `clsd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function teluguDayName(dateStr) {
  const days = ['ఆదివారం', 'సోమవారం', 'మంగళవారం', 'బుధవారం', 'గురువారం', 'శుక్రవారం', 'శనివారం']
  const d = dateStr ? new Date(dateStr) : new Date()
  return days[d.getDay()] || 'బుధవారం'
}

export async function getHeaderStylesPayload() {
  const catalog = await fetchPublicHeaderStylesCatalog()
  return {
    source: catalog.source || 'catalog',
    mainHeaders: catalog.mainHeaders || [],
    subHeaders: catalog.subHeaders || [],
    renderEngine: catalog.renderEngine,
  }
}

export async function getSmartDesignContext(tenantId, { editionId, subEditionId, tenantName } = {}) {
  const doc = readTenantDoc(tenantId)
  const designs = doc.designs || []
  const scoped = designs.filter((d) => {
    if (editionId && d.publicationEditionId !== editionId) return false
    if (subEditionId && d.subEditionId !== subEditionId) return false
    return true
  })

  let headerStyles = { mainHeaders: [], subHeaders: [] }
  try {
    headerStyles = await getHeaderStylesPayload()
  } catch {
    /* backend catalog optional for local file-store dev */
  }

  return {
    tenant: { id: String(tenantId), name: tenantName || doc.meta?.tenantName || `Tenant ${tenantId}` },
    prgiNumber: doc.meta?.prgiNumber || `PRGI/${tenantId}`,
    epaperDomain: doc.meta?.epaperDomain || doc.meta?.domain || `epaper.${tenantId}.local`,
    editions: doc.meta?.editions || [],
    headerStyles,
    activeDesign: scoped[0] || designs[0] || null,
    totalDesigns: designs.length,
  }
}

export function listSmartDesigns(tenantId, { publicationEditionId, subEditionId } = {}) {
  const doc = readTenantDoc(tenantId)
  let items = doc.designs || []
  if (publicationEditionId) {
    items = items.filter((d) => d.publicationEditionId === publicationEditionId)
  }
  if (subEditionId) {
    items = items.filter((d) => d.subEditionId === subEditionId)
  }
  return { tenantId: String(tenantId), total: items.length, items }
}

export function getSmartDesign(tenantId, id) {
  const doc = readTenantDoc(tenantId)
  const design = (doc.designs || []).find((d) => d.id === id)
  if (!design) return null
  return {
    design,
    prgiNumber: doc.meta?.prgiNumber || `PRGI/${tenantId}`,
    epaperDomain: doc.meta?.epaperDomain || `epaper.${tenantId}.local`,
  }
}

export function createSmartDesign(tenantId, body) {
  const doc = readTenantDoc(tenantId)
  const editionId = body.publicationEditionId || body.editionId
  const subId = body.subEditionId || null
  const dup = (doc.designs || []).find(
    (d) =>
      d.publicationEditionId === editionId &&
      (subId ? d.subEditionId === subId : !d.subEditionId)
  )
  if (dup) {
    const err = new Error('Design already exists for this edition scope')
    err.status = 409
    err.existingId = dup.id
    throw err
  }

  const headerNum = Number(body.headerStyleNumber) || 1
  const subNum = Number(body.subHeaderStyleNumber) || 1
  const now = new Date().toISOString()
  const issueDate = body.today?.issueDate || body.issueDate || now.slice(0, 10)

  const design = {
    id: newId(),
    tenantId: String(tenantId),
    publicationEditionId: editionId,
    subEditionId: subId,
    scopeType: subId ? 'sub-edition' : 'edition',
    pageSize: body.pageSize || body.paperType || 'TABLOID',
    paperType: body.paperType || body.pageSize || 'Tabloid',
    totalPages: Number(body.totalPages ?? body.defaultPageCount) || 8,
    perPagePrice: Number(body.perPagePrice) || 0,
    paperSellCost: Number(body.paperSellCost) || 5,
    headerStyleNumber: headerNum,
    subHeaderStyleNumber: subNum,
    headerStyleKey: body.headerStyleKey || mainStyleKey(headerNum),
    subHeaderStyleKey: body.subHeaderStyleKey || subStyleKey(subNum),
    headerLogoUrl: body.headerLogoUrl || '',
    subHeaderLogoUrl: body.subHeaderLogoUrl || '',
    subHeaderImageUrl: body.subHeaderImageUrl || '',
    paperNameImageUrl: body.paperNameImageUrl || '',
    headerLeftImageUrl: body.headerLeftImageUrl || body.adLeftUrl || '',
    headerRightImageUrl: body.headerRightImageUrl || body.adRightUrl || '',
    mainHeaderImageUrl: body.mainHeaderImageUrl || '',
    publishedAreaText: body.publishedAreaText || body.publishedAreas || '',
    tagline: body.tagline || '',
    websiteUrl: body.websiteUrl || '',
    runningCommentText: body.runningCommentText || '',
    runningCommentAuthor: body.runningCommentAuthor || '',
    rightArticleTitle: body.rightArticleTitle || '',
    rightArticlePoints: body.rightArticlePoints || '',
    accentColor: body.accentColor || '#dc2626',
    today: {
      issueDate,
      dayNameTelugu: body.today?.dayNameTelugu || teluguDayName(issueDate),
      currentVolume: Number(body.today?.currentVolume ?? body.volumeNumber) || 1,
      currentIssue: Number(body.today?.currentIssue ?? body.issueNumber) || 1,
      maxIssuePerYear: Number(body.today?.maxIssuePerYear) || 365,
    },
    createdAt: now,
    updatedAt: now,
  }

  doc.designs = [...(doc.designs || []), design]
  if (body.epaperDomain) doc.meta = { ...doc.meta, epaperDomain: body.epaperDomain }
  if (body.prgiNumber) doc.meta = { ...doc.meta, prgiNumber: body.prgiNumber }
  writeTenantDoc(tenantId, doc)

  return {
    success: true,
    prgiNumber: doc.meta?.prgiNumber || `PRGI/${tenantId}`,
    epaperDomain: doc.meta?.epaperDomain || `epaper.${tenantId}.local`,
    design,
  }
}

export function updateSmartDesign(tenantId, id, body, { partial = false } = {}) {
  const doc = readTenantDoc(tenantId)
  const idx = (doc.designs || []).findIndex((d) => d.id === id)
  if (idx < 0) return null

  const prev = doc.designs[idx]
  const merged = partial ? { ...prev, ...body } : { ...prev, ...body, id: prev.id, tenantId: prev.tenantId }
  if (body.headerStyleNumber) merged.headerStyleKey = body.headerStyleKey || mainStyleKey(body.headerStyleNumber)
  if (body.subHeaderStyleNumber) merged.subHeaderStyleKey = body.subHeaderStyleKey || subStyleKey(body.subHeaderStyleNumber)
  if (body.today) merged.today = { ...prev.today, ...body.today }
  merged.updatedAt = new Date().toISOString()
  doc.designs[idx] = merged
  writeTenantDoc(tenantId, doc)
  return { success: true, design: merged }
}

export function deleteSmartDesign(tenantId, id) {
  const doc = readTenantDoc(tenantId)
  const before = (doc.designs || []).length
  doc.designs = (doc.designs || []).filter((d) => d.id !== id)
  if (doc.designs.length === before) return null
  writeTenantDoc(tenantId, doc)
  return { success: true, id, message: 'Smart design deleted' }
}
