import React, { useEffect, useRef, useState } from 'react'
import styles from './ArticleBlock2in1col.module.css'

const CATEGORY_COLORS = {
  political: '#2C3E50',
  crime: '#C0392B',
  sports: '#16A085',
  business: '#8E44AD',
  entertainment: '#D35400',
  general: '#34495E',
}

export default function ArticleBlock2in1col({
  title,
  subtitle,
  category = 'general',
  dateline = '',
  highlights = [],
  images = [],
  paragraphs = [],
}) {
  const titleRef = useRef(null)
  const [titleFontSize, setTitleFontSize] = useState(16)
  const subtitleColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.general

  useEffect(() => {
    if (!titleRef.current || !title) return
    const minSize = 8
    const maxSize = 20
    const calculateTitleSize = () => {
      if (!titleRef.current) return
      const containerWidthPx = titleRef.current.parentElement?.clientWidth || titleRef.current.clientWidth || 160
      const temp = document.createElement('span')
      temp.style.fontFamily = 'Mandali, sans-serif'
      temp.style.fontWeight = '700'
      temp.style.visibility = 'hidden'
      temp.style.position = 'absolute'
      temp.style.left = '-9999px'
      temp.style.top = '-9999px'
      temp.style.display = 'block'
      temp.style.width = `${containerWidthPx}px`
      temp.style.whiteSpace = 'normal'
      temp.style.wordBreak = 'break-word'
      temp.style.overflowWrap = 'anywhere'
      temp.style.lineHeight = '1.28'
      temp.style.letterSpacing = '0.01em'
      temp.textContent = title
      document.body.appendChild(temp)

      let fitSize = minSize
      for (let size = maxSize; size >= minSize; size--) {
        temp.style.fontSize = `${size}px`
        const lineHeight = size * 1.28
        const lineCount = Math.ceil(temp.offsetHeight / lineHeight)
        if (lineCount <= 2) {
          fitSize = size
          break
        }
      }

      document.body.removeChild(temp)
      setTitleFontSize(fitSize)
    }

    calculateTitleSize()
    if (document.fonts?.ready) {
      document.fonts.ready.then(calculateTitleSize)
    }
    window.addEventListener('resize', calculateTitleSize)
    return () => window.removeEventListener('resize', calculateTitleSize)
  }, [title])

  const image = images && images.length > 0 ? images[0] : null
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
        <p key={`${keyPrefix}-p-${paraIndex++}`}>
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
        nodes.push(<h3 key={`${keyPrefix}-h-${idx}`}>{item.content}</h3>)
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
    <div className={styles.articleBlock}>
      <div className={styles.titleWrap}>
        <h1 ref={titleRef} className={styles.title} style={{ fontSize: `${titleFontSize}px` }}>
          {title}
        </h1>
        {subtitle ? <h2 className={styles.subtitle} style={{ color: subtitleColor }}>{subtitle}</h2> : null}
      </div>

      {image ? (
        <figure className={styles.articleImage}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt={image.alt || ''} />
          {image.caption ? <figcaption>{image.caption}</figcaption> : null}
        </figure>
      ) : null}

      {highlights.length > 0 ? (
        <div className={styles.highlightBox}>
          <ul>{highlights.map((item, idx) => <li key={idx}>{item}</li>)}</ul>
        </div>
      ) : null}

      <div className={styles.articleContent}>
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
