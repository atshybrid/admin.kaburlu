import React, { useEffect, useRef, useState } from 'react'
import styles from './ClassicArticleBlock.module.css'

// Category color mapping - newspaper style
const CATEGORY_COLORS = {
  political: '#2C3E50',      // Dark blue-gray
  crime: '#C0392B',          // Dark red
  sports: '#16A085',         // Teal
  business: '#8E44AD',       // Purple
  entertainment: '#D35400',  // Orange
  general: '#34495E',        // Default dark gray
}

export default function ClassicArticleBlock({ 
  title, 
  subtitle,
  category = 'general',
  dateline = '',
  highlights = [], 
  images = [], 
  paragraphs = [] 
}) {
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const [titleFontSize, setTitleFontSize] = useState(32)
  const [subtitleFontSize, setSubtitleFontSize] = useState(16)
  const subtitleColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.general

  useEffect(() => {
    if (!titleRef.current || !title) return

    const maxWidth = 200.5 // 203.2mm - 5px left - 5px right (≈1.35mm each)
    const minSize = 28
    const maxSize = 42
    let currentSize = minSize

    // Create temporary element to measure text
    const temp = document.createElement('span')
    temp.style.fontFamily = 'Mandali, sans-serif'
    temp.style.fontWeight = '600' // SEMI-BOLD
    temp.style.visibility = 'hidden'
    temp.style.position = 'absolute'
    temp.style.whiteSpace = 'nowrap'
    temp.textContent = title
    document.body.appendChild(temp)

    // Find optimal font size
    for (let size = minSize; size <= maxSize; size++) {
      temp.style.fontSize = size + 'px'
      const width = temp.offsetWidth * 0.264583 // px to mm
      
      if (width > maxWidth) {
        break
      }
      currentSize = size
    }

    document.body.removeChild(temp)
    setTitleFontSize(currentSize)
  }, [title])

  // Auto-fit subtitle (smaller range than title)
  useEffect(() => {
    if (!subtitleRef.current || !subtitle) return

    const maxWidth = 200.5 // 203.2mm - 5px left - 5px right (≈1.35mm each)
    const minSize = 16
    const maxSize = 22 // Smaller than title max
    let currentSize = minSize

    const temp = document.createElement('span')
    temp.style.fontFamily = 'Mandali, sans-serif'
    temp.style.fontWeight = '600'
    temp.style.visibility = 'hidden'
    temp.style.position = 'absolute'
    temp.style.whiteSpace = 'nowrap'
    temp.textContent = subtitle
    document.body.appendChild(temp)

    for (let size = minSize; size <= maxSize; size++) {
      temp.style.fontSize = size + 'px'
      const width = temp.offsetWidth * 0.264583
      
      if (width > maxWidth) {
        break
      }
      currentSize = size
    }

    document.body.removeChild(temp)
    setSubtitleFontSize(currentSize)
  }, [subtitle])

  const totalParas = paragraphs.length

  // Initial balanced split
  const initialCol1End = Math.ceil(totalParas / 3)
  const initialCol2End = Math.ceil(totalParas * 2 / 3)

  const [col1End, setCol1End] = useState(initialCol1End)
  const [col2End, setCol2End] = useState(initialCol2End)

  const col1Ref = useRef(null)
  const col2Ref = useRef(null)
  const col3Ref = useRef(null)
  const balanceRound = useRef(0)

  // Reset breaks when paragraphs change
  useEffect(() => {
    balanceRound.current = 0
    setCol1End(Math.ceil(totalParas / 3))
    setCol2End(Math.ceil(totalParas * 2 / 3))
  }, [paragraphs, images, highlights, totalParas])

  // After each render, measure actual column heights and rebalance
  useEffect(() => {
    if (!col1Ref.current || !col2Ref.current || !col3Ref.current) return
    if (balanceRound.current >= 8) return // max iterations

    const h1 = col1Ref.current.scrollHeight
    const h2 = col2Ref.current.scrollHeight
    const h3 = col3Ref.current.scrollHeight

    // Subtract image heights so only text portions are compared
    const img2 = col2Ref.current.querySelector('figure')
    const img3 = col3Ref.current.querySelector('figure')
    const effectiveH2 = h2 - (img2 ? img2.offsetHeight : 0)
    const effectiveH3 = h3 - (img3 ? img3.offsetHeight : 0)

    const maxH = Math.max(h1, effectiveH2, effectiveH3)
    const minH = Math.min(h1, effectiveH2, effectiveH3)

    if (maxH - minH <= 18) {
      balanceRound.current = 0
      return
    }

    balanceRound.current++

    let c1 = col1End
    let c2 = col2End

    if (h1 >= effectiveH2 && h1 >= effectiveH3) {
      c1 = Math.max(1, c1 - 1)
    } else if (effectiveH3 >= h1 && effectiveH3 >= effectiveH2) {
      c2 = Math.max(c1 + 1, c2 - 1)
    } else {
      c1 = Math.min(totalParas - 2, c1 + 1)
    }

    c2 = Math.max(c1 + 1, Math.min(totalParas - 1, c2))
    setCol1End(c1)
    setCol2End(c2)
  }, [col1End, col2End, totalParas])
  return (
    <div className={styles.articleBlock}>
      <div className={styles.titleWrap}>
        <h1 
          ref={titleRef}
          className={styles.title}
          style={{ fontSize: `${titleFontSize}px` }}
        >
          {title}
        </h1>
        {subtitle && (
          <h2 
            ref={subtitleRef}
            className={styles.subtitle}
            style={{ 
              fontSize: `${subtitleFontSize}px`,
              color: subtitleColor 
            }}
          >
            {subtitle}
          </h2>
        )}
      </div>

      <div className={styles.articleColumns}>
        
        {/* COLUMN 1 */}
        <div className={styles.column} ref={col1Ref}>
          {/* Highlight OR Dateline+first para at top */}
          {highlights.length > 0 ? (
            <div className={styles.highlightBox}>
              <ul>
                {highlights.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          
          {/* Column 1 text — dateline inline at start of first para */}
          {!highlights.length && paragraphs.length > 0 && (
            <p className={styles.firstPara}>
              {dateline && (
                <span className={styles.dateline}>{dateline} </span>
              )}
              {paragraphs[0]?.content || paragraphs[0]}
            </p>
          )}
          {paragraphs.slice(!highlights.length ? 1 : 0, col1End).map((item, idx) => {
            if (item.type === 'heading') {
              return <h3 key={`c1-${idx}`}>{item.content}</h3>
            }
            return <p key={`c1-${idx}`}>{item.content || item}</p>
          })}
        </div>

        {/* COLUMN 2 */}
        <div className={styles.column} ref={col2Ref}>
          {/* Image 1 at top (if exists) */}
          {images && images.length > 0 && images[0] && (
            <figure className={styles.articleImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[0].src} alt={images[0].alt || ''} />
              {images[0].caption && <figcaption>{images[0].caption}</figcaption>}
            </figure>
          )}
          
          {/* Column 2 text */}
          {paragraphs.slice(col1End, col2End).map((item, idx) => {
            if (item.type === 'heading') {
              return <h3 key={`c2-${idx}`}>{item.content}</h3>
            }
            return <p key={`c2-${idx}`}>{item.content || item}</p>
          })}
        </div>

        {/* COLUMN 3 */}
        <div className={styles.column} ref={col3Ref}>
          {/* Image 2 at top (if exists) */}
          {images && images.length > 1 && images[1] && (
            <figure className={styles.articleImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[1].src} alt={images[1].alt || ''} />
              {images[1].caption && <figcaption>{images[1].caption}</figcaption>}
            </figure>
          )}
          
          {/* Column 3 text */}
          {paragraphs.slice(col2End).map((item, idx) => {
            if (item.type === 'heading') {
              return <h3 key={`c3-${idx}`}>{item.content}</h3>
            }
            return <p key={`c3-${idx}`}>{item.content || item}</p>
          })}
        </div>

      </div>
    </div>
  )
}
