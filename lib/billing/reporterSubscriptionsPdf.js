import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { downloadPdfBytes } from '../epaper/exportEpaperPdf'
import {
  monthsDueCount,
  outstandingMonthsList,
  reporterDisplayName,
  reporterDueRupees,
  reporterMobile,
  reporterTotalPayable,
} from './reporterSubscriptionRow'

const PAGE_SIZE = [841.89, 595.28]
const MARGIN = 36
const FONT_SIZE = 8
const HEADER_SIZE = 9
const LINE_HEIGHT = 12
const COLS = [
  { key: 'name', label: 'Reporter', w: 150 },
  { key: 'mobile', label: 'Mobile', w: 72 },
  { key: 'bucket', label: 'Bucket', w: 52 },
  { key: 'months', label: 'Mo.', w: 28 },
  { key: 'due', label: 'Due (INR)', w: 52 },
  { key: 'base', label: 'Base', w: 44 },
  { key: 'total', label: 'Payable', w: 48 },
  { key: 'detail', label: 'Outstanding months', w: 200 },
]

/** pdf-lib StandardFonts = WinAnsi only — no Rupee sign or Telugu */
export function pdfSafeText(text, maxLen) {
  let s = String(text ?? '')
    .replace(/\u20B9|₹/g, 'Rs.')
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/\u00B7/g, ' | ')
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\s+/g, ' ')
    .trim()
  if (maxLen && s.length > maxLen) s = `${s.slice(0, maxLen - 3)}...`
  return s
}

function rowCells(row) {
  const due = reporterDueRupees(row)
  return {
    name: pdfSafeText(reporterDisplayName(row), 32),
    mobile: pdfSafeText(reporterMobile(row) || '-', 14),
    bucket: pdfSafeText(row.bucket || '-', 10),
    months: pdfSafeText(String(monthsDueCount(row) || '-')),
    due: due !== '' ? pdfSafeText(String(due)) : '-',
    base: row.monthlySubscriptionAmountRupees != null
      ? pdfSafeText(String(row.monthlySubscriptionAmountRupees))
      : '-',
    total: reporterTotalPayable(row) !== '' && reporterTotalPayable(row) != null
      ? pdfSafeText(String(reporterTotalPayable(row)))
      : '-',
    detail: pdfSafeText(outstandingMonthsList(row).join(', '), 70),
  }
}

function drawSafe(page, text, opts = {}) {
  const { maxLen, ...drawOpts } = opts
  page.drawText(pdfSafeText(text, maxLen), drawOpts)
}

export async function downloadReporterSubscriptionsPdf(rows, meta = {}) {
  const { tenantSlug, tenantName, bucket, from, to } = meta
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage(PAGE_SIZE)
  let y = page.getHeight() - MARGIN

  const title = 'Reporter subscriptions - Platform billing'
  drawSafe(page, title, { x: MARGIN, y, size: 14, font: fontBold, color: rgb(0.1, 0.1, 0.15) })
  y -= 18

  const subtitle = [
    tenantName || tenantSlug || 'Tenant',
    `Bucket: ${bucket || 'all'}`,
    from && to ? `Range: ${from} to ${to}` : null,
    `Rows: ${rows.length}`,
    `Generated: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
  ]
    .filter(Boolean)
    .join(' | ')
  drawSafe(page, subtitle, { x: MARGIN, y, size: 9, font, color: rgb(0.35, 0.35, 0.4), maxLen: 140 })
  y -= 22

  const drawTableHeader = () => {
    let x = MARGIN
    COLS.forEach((col) => {
      drawSafe(page, col.label, { x, y, size: HEADER_SIZE, font: fontBold, color: rgb(0.2, 0.2, 0.25) })
      x += col.w
    })
    y -= LINE_HEIGHT
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: page.getWidth() - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.75, 0.75, 0.8),
    })
    y -= 6
  }

  const newPage = () => {
    page = pdfDoc.addPage(PAGE_SIZE)
    y = page.getHeight() - MARGIN
    drawSafe(page, title, { x: MARGIN, y, size: 10, font: fontBold })
    y -= 20
    drawTableHeader()
  }

  drawTableHeader()

  rows.forEach((row) => {
    if (y < MARGIN + 40) newPage()
    const cells = rowCells(row)
    let x = MARGIN
    COLS.forEach((col) => {
      drawSafe(page, String(cells[col.key] ?? ''), {
        x,
        y,
        size: FONT_SIZE,
        font,
        color: rgb(0.15, 0.15, 0.2),
      })
      x += col.w
    })
    y -= LINE_HEIGHT
  })

  const slug = (tenantSlug || 'tenant').replace(/[^\w-]+/g, '_')
  const filename = `reporters-${slug}-${bucket || 'all'}-${from || 'na'}-${to || 'na'}.pdf`
  const bytes = await pdfDoc.save()
  downloadPdfBytes(bytes, filename)
}
