import React, { useEffect, useRef, useState } from 'react'
import styles from './ArticleBlock12in4col.module.css'

const CATEGORY_COLORS = {
  political: '#2C3E50',
  crime: '#C0392B',
  sports: '#16A085',
  business: '#8E44AD',
  entertainment: '#D35400',
  general: '#34495E',
}

// 12-inch wide, 4-column article block
export default function ArticleBlock12in4col({
  title,
  subtitle,
  category = 'general',
  dateline = '',
  highlights = [],
  images = [],
  paragraphs = [],
}) {
  const titleRef = useRef(null)
  const [titleFontSize, setTitleFontSize] = useState(36)
  const subtitleColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.general

  // 12in = 304.8mm, minus ~1.35mm each side ≈ 302.1mm
  useEffect(() => {
    if (!titleRef.current || !title) return
    const maxWidth = 302.1
    const minSize = 32
    const maxSize = 52
    let currentSize = minSize
    const temp = document.createElement('span')
    temp.style.fontFamily = 'Mandali, sans-serif'
    temp.style.fontWeight = '700'
    temp.style.visibility = 'hidden'
    temp.style.position = 'absolute'
    temp.style.whiteSpace = 'nowrap'
    temp.textContent = title
    document.body.appendChild(temp)
    for (let size = minSize; size <= maxSize; size++) {
      temp.style.fontSize = size + 'px'
      if (temp.offsetWidth * 0.264583 > maxWidth) break
      currentSize = size
    }
    document.body.removeChild(temp)
    setTitleFontSize(currentSize)
  }, [title])

  const totalParas = paragraphs.length

  const [col1End, setCol1End] = useState(Math.ceil(totalParas / 4))
  const [col2End, setCol2End] = useState(Math.ceil(totalParas / 2))
  const [col3End, setCol3End] = useState(Math.ceil(totalParas * 3 / 4))

  const col1Ref = useRef(null)
  const col2Ref = useRef(null)
  const col3Ref = useRef(null)
  const col4Ref = useRef(null)
  const balanceRound = useRef(0)

  useEffect(() => {
    balanceRound.current = 0
    setCol1End(Math.ceil(totalParas / 4))
    setCol2End(Math.ceil(totalParas / 2))
    setCol3End(Math.ceil(totalParas * 3 / 4))
  }, [paragraphs, images, highlights, totalParas])

  useEffect(() => {
    if (!col1Ref.current || !col2Ref.current || !col3Ref.current || !col4Ref.current) return
    if (balanceRound.current >= 12) return

    const h1 = col1Ref.current.scrollHeight
    const h2 = col2Ref.current.scrollHeight
    const h3 = col3Ref.current.scrollHeight
    const h4 = col4Ref.current.scrollHeight

    // Subtract image heights so only text portions are compared
    const img2 = col2Ref.current.querySelector('figure')
    const img3 = col3Ref.current.querySelector('figure')
    const img4 = col4Ref.current.querySelector('figure')
    const eH2 = h2 - (img2 ? img2.offsetHeight : 0)
    const eH3 = h3 - (img3 ? img3.offsetHeight : 0)
    const eH4 = h4 - (img4 ? img4.offsetHeight : 0)

    const maxH = Math.max(h1, eH2, eH3, eH4)
    const minH = Math.min(h1, eH2, eH3, eH4)

    if (maxH - minH <= 18) { balanceRound.current = 0; return }
    balanceRound.current++

    let c1 = col1End, c2 = col2End, c3 = col3End

    if (h1 === maxH) {
      c1 = Math.max(1, c1 - 1)
    } else if (eH2 === maxH) {
      c2 = Math.max(c1 + 1, c2 - 1)
    } else if (eH3 === maxH) {
      c3 = Math.max(c2 + 1, c3 - 1)
    } else {
      c3 = Math.max(c2 + 1, c3 - 1)
    }

    c2 = Math.max(c1 + 1, Math.min(totalParas - 2, c2))
    c3 = Math.max(c2 + 1, Math.min(totalParas - 1, c3))

    setCol1End(c1)
    setCol2End(c2)
    setCol3End(c3)
  }, [col1End, col2End, col3End, totalParas])

  return (
    <div className={styles.articleBlock}>
      <div className={styles.titleWrap}>
        <h1 ref={titleRef} className={styles.title} style={{ fontSize: `${titleFontSize}px` }}>
          {title}
        </h1>
        {subtitle && (
          <h2 className={styles.subtitle} style={{ color: subtitleColor }}>{subtitle}</h2>
        )}
      </div>

      <div className={styles.articleColumns}>
        {/* COLUMN 1 */}
        <div className={styles.column} ref={col1Ref}>
          {highlights.length > 0 ? (
            <div className={styles.highlightBox}>
              <ul>{highlights.map((item, idx) => <li key={idx}>{item}</li>)}</ul>
            </div>
          ) : null}
          {!highlights.length && paragraphs.length > 0 && (
            <p className={styles.firstPara}>
              {dateline && <span className={styles.dateline}>{dateline} </span>}
              {paragraphs[0]?.content || paragraphs[0]}
            </p>
          )}
          {paragraphs.slice(!highlights.length ? 1 : 0, col1End).map((item, idx) => {
            if (item.type === 'heading') return <h3 key={`c1-${idx}`}>{item.content}</h3>
            return <p key={`c1-${idx}`}>{item.content || item}</p>
          })}
        </div>

        {/* COLUMN 2 */}
        <div className={styles.column} ref={col2Ref}>
          {images && images.length > 0 && images[0] && (
            <figure className={styles.articleImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[0].src} alt={images[0].alt || ''} />
              {images[0].caption && <figcaption>{images[0].caption}</figcaption>}
            </figure>
          )}
          {paragraphs.slice(col1End, col2End).map((item, idx) => {
            if (item.type === 'heading') return <h3 key={`c2-${idx}`}>{item.content}</h3>
            return <p key={`c2-${idx}`}>{item.content || item}</p>
          })}
        </div>

        {/* COLUMN 3 */}
        <div className={styles.column} ref={col3Ref}>
          {images && images.length > 1 && images[1] && (
            <figure className={styles.articleImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[1].src} alt={images[1].alt || ''} />
              {images[1].caption && <figcaption>{images[1].caption}</figcaption>}
            </figure>
          )}
          {paragraphs.slice(col2End, col3End).map((item, idx) => {
            if (item.type === 'heading') return <h3 key={`c3-${idx}`}>{item.content}</h3>
            return <p key={`c3-${idx}`}>{item.content || item}</p>
          })}
        </div>

        {/* COLUMN 4 */}
        <div className={styles.column} ref={col4Ref}>
          {images && images.length > 2 && images[2] && (
            <figure className={styles.articleImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[2].src} alt={images[2].alt || ''} />
              {images[2].caption && <figcaption>{images[2].caption}</figcaption>}
            </figure>
          )}
          {paragraphs.slice(col3End).map((item, idx) => {
            if (item.type === 'heading') return <h3 key={`c4-${idx}`}>{item.content}</h3>
            return <p key={`c4-${idx}`}>{item.content || item}</p>
          })}
        </div>
      </div>
    </div>
  )
}
