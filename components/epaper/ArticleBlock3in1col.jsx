import React from 'react'
import styles from './ArticleBlock3in1col.module.css'

const CATEGORY_COLORS = {
  political: '#2C3E50',
  crime: '#C0392B',
  sports: '#16A085',
  business: '#8E44AD',
  entertainment: '#D35400',
  general: '#34495E',
}

/** Stable hue from title+category when API does not send titleColor */
function hashHue(str) {
  let h = 0
  const s = String(str || '')
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h) % 360
}

function resolveTitleColor(titleColor, title, category) {
  const raw = String(titleColor || '').trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw)) return raw
  const hue = hashHue(`${title}|${category}`)
  return `hsl(${hue}, 52%, 24%)`
}

function normalizeImage(img) {
  if (!img) return null
  const src = img.src || img.url || img.imageUrl || ''
  if (!src) return null
  return {
    src,
    alt: img.alt || '',
    caption: img.caption || '',
  }
}

/**
 * BLOCK-03A — 3-inch × 1 column, “Style 1” (Telugu daily brief)
 *
 * • Physical width 76.2mm (3in). Max block height ≈ 4in — overflow clipped (long copy → larger block).
 * • Title colour: `titleColor` (hex from backend) else stable HSL from title hash.
 * • Highlights: each point is a full-width dashed underline block (multi-line wraps; rule under block).
 * • One text column: optional lead image floats right, `object-fit: cover` + smart-ish `object-position`.
 * • First paragraph opens with bold dateline when `dateline` is set.
 *
 * Page chrome (logo, footer URL) is never rendered here — story body only.
 */
export default function ArticleBlock3in1col({
  title,
  subtitle = '',
  category = 'general',
  dateline = '',
  highlights = [],
  images = [],
  paragraphs = [],
  titleColor = '',
  imageObjectPosition = '',
}) {
  const accentFallback = CATEGORY_COLORS[category] || CATEGORY_COLORS.general
  const resolvedTitleColor = resolveTitleColor(titleColor, title, category)
  const focus = String(imageObjectPosition || '').trim() || '50% 28%'
  const image = normalizeImage(images?.[0])

  const flowStart = highlights.length ? 0 : 1
  const flowItems = paragraphs.slice(flowStart)

  const renderContinuousFlow = (items, keyPrefix, initialText = '', includeDateline = false) => {
    const nodes = []
    let buffer = String(initialText || '').trim()
    let paraIndex = 0
    let datelinePending = includeDateline && !!dateline

    const flush = () => {
      if (!buffer) return
      nodes.push(
        <p key={`${keyPrefix}-p-${paraIndex++}`} className={styles.bodyPara}>
          {datelinePending ? <span className={styles.dateline}>{dateline} </span> : null}
          {buffer}
        </p>
      )
      datelinePending = false
      buffer = ''
    }

    items.forEach((item, idx) => {
      if (item?.type === 'heading') {
        flush()
        nodes.push(<h3 key={`${keyPrefix}-h-${idx}`} className={styles.inlineHeading}>{item.content}</h3>)
        return
      }
      const text = String(item?.content || item || '').trim()
      if (!text) return
      buffer = buffer ? `${buffer} ${text}` : text
    })

    flush()
    return nodes
  }

  return (
    <div
      className={styles.articleBlock}
      style={{ '--title-color': resolvedTitleColor, '--img-focus': focus }}
    >
      <div className={styles.titleWrap}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? (
          <h2 className={styles.subtitle} style={{ color: accentFallback }}>
            {subtitle}
          </h2>
        ) : null}
      </div>

      {highlights.length > 0 ? (
        <ul className={styles.highlightDashList} aria-label="Highlights">
          {highlights.map((item, idx) => (
            <li key={idx} className={styles.highlightDashItem}>
              {typeof item === 'string' ? item : (item?.text || item?.content || '')}
            </li>
          ))}
        </ul>
      ) : null}

      <div className={styles.articleContent}>
        {image ? (
          <figure className={styles.floatFigure}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt || ''}
              className={styles.floatImg}
            />
            {image.caption ? <figcaption className={styles.floatCaption}>{image.caption}</figcaption> : null}
          </figure>
        ) : null}

        {renderContinuousFlow(
          flowItems,
          'c1',
          !highlights.length && paragraphs.length > 0 ? (paragraphs[0]?.content || paragraphs[0]) : '',
          !highlights.length && paragraphs.length > 0
        )}
      </div>
    </div>
  )
}
