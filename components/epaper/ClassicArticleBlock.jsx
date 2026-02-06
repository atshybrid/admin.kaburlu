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

    const maxWidth = 203.2 // 8 inch in mm
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

    const maxWidth = 203.2 // 8 inch in mm
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

  // QuarkXPress-style distribution with heading consideration
  const totalParas = paragraphs.length
  
  const hasHighlights = highlights.length > 0
  const hasImage1 = images && images.length > 0
  const hasImage2 = images && images.length > 1
  
  // Count headings in paragraphs (they take more vertical space)
  const headingCount = paragraphs.filter(p => p.type === 'heading').length
  const regularParaCount = totalParas - headingCount
  
  // Define fixed height ratios
  const PARA_HEIGHT = 16       // Regular paragraph
  const HEADING_HEIGHT = 24    // Heading (larger)
  const HIGHLIGHT_HEIGHT = 85  // Highlight box
  const IMAGE_HEIGHT = 65      // Image + caption
  
  // Calculate total content height
  const totalParaHeight = (regularParaCount * PARA_HEIGHT) + (headingCount * HEADING_HEIGHT)
  const totalFixedHeight = 
    (hasHighlights ? HIGHLIGHT_HEIGHT : 0) +
    (hasImage1 ? IMAGE_HEIGHT : 0) +
    (hasImage2 ? IMAGE_HEIGHT : 0)
  
  // Target height per column
  const targetColumnHeight = (totalParaHeight + totalFixedHeight) / 3
  
  // Calculate available space for text content per column
  const col1AvailableHeight = targetColumnHeight - (hasHighlights ? HIGHLIGHT_HEIGHT : 0)
  const col2AvailableHeight = targetColumnHeight - (hasImage1 ? IMAGE_HEIGHT : 0)
  const col3AvailableHeight = targetColumnHeight - (hasImage2 ? IMAGE_HEIGHT : 0)
  
  // Simple approach: count items needed per column
  // Approximate by treating all content as average height
  const avgItemHeight = totalParaHeight / totalParas
  
  let col1Items = Math.round(col1AvailableHeight / avgItemHeight)
  let col2Items = Math.round(col2AvailableHeight / avgItemHeight)
  let col3Items = totalParas - col1Items - col2Items
  
  // Ensure positive values
  col1Items = Math.max(col1Items, 1)
  col2Items = Math.max(col2Items, 1)
  col3Items = Math.max(col3Items, 1)
  
  // Adjust for total mismatch
  const totalDistributed = col1Items + col2Items + col3Items
  if (totalDistributed !== totalParas) {
    col3Items += (totalParas - totalDistributed)
  }
  
  const col1End = col1Items
  const col2End = col1End + col2Items
  return (
    <div className={styles.articleBlock}>
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

      <div className={styles.articleColumns}>
        
        {/* COLUMN 1 */}
        <div className={styles.column}>
          {/* Highlight OR Dateline at top */}
          {highlights.length > 0 ? (
            <div className={styles.highlightBox}>
              <ul>
                {highlights.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ) : dateline ? (
            <p className={styles.dateline}>{dateline}</p>
          ) : null}
          
          {/* Column 1 text */}
          {!highlights.length && dateline && (
            <p className={styles.firstPara}>{paragraphs[0]?.content || paragraphs[0]}</p>
          )}
          {paragraphs.slice(highlights.length > 0 || dateline ? 1 : 0, col1End).map((item, idx) => {
            if (item.type === 'heading') {
              return <h3 key={`c1-${idx}`}>{item.content}</h3>
            }
            return <p key={`c1-${idx}`}>{item.content || item}</p>
          })}
        </div>

        {/* COLUMN 2 */}
        <div className={styles.column}>
          {/* Image 1 at top (if exists) */}
          {images && images.length > 0 && images[0] && (
            <figure className={styles.articleImage}>
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
        <div className={styles.column}>
          {/* Image 2 at top (if exists) */}
          {images && images.length > 1 && images[1] && (
            <figure className={styles.articleImage}>
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
