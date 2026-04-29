import React, { useEffect, useRef, useState } from 'react'
import styles from './ArticleBlock6in2col.module.css'

const CATEGORY_COLORS = {
  political: '#2C3E50',
  crime: '#C0392B',
  sports: '#16A085',
  business: '#8E44AD',
  entertainment: '#D35400',
  general: '#34495E',
}

// 6-inch wide, 2-column article block
export default function ArticleBlock6in2col({
  title,
  subtitle,
  category = 'general',
  dateline = '',
  highlights = [],
  images = [],
  paragraphs = [],
}) {
  const titleRef = useRef(null)
  const [titleFontSize, setTitleFontSize] = useState(26)
  const subtitleColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.general

  // 6in = 152.4mm, minus ~1.35mm each side ≈ 149.7mm
  useEffect(() => {
    if (!titleRef.current || !title) return
    const maxWidth = 149.7
    const minSize = 20
    const maxSize = 34
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

  const flowStart = highlights.length ? 0 : 1
  const flowItems = paragraphs.slice(flowStart)
  const totalFlow = flowItems.length

  const imageCount = images?.length || 0
  const columnCount = imageCount >= 3 ? 4 : imageCount === 2 ? 3 : 2
  const imageSlots = Math.max(0, columnCount - 1)
  const slotImages = (images || []).slice(0, imageSlots)
  const overflowImages = (images || []).slice(imageSlots)

  const getInitialCuts = (total, cols) => {
    const cuts = []
    for (let index = 1; index < cols; index++) {
      cuts.push(Math.round((total * index) / cols))
    }
    return cuts
  }

  const [cuts, setCuts] = useState(getInitialCuts(totalFlow, columnCount))
  const [balanceTick, setBalanceTick] = useState(0)
  const colRefs = useRef([])
  const balanceRound = useRef(0)

  useEffect(() => {
    colRefs.current = new Array(columnCount)
  }, [columnCount])

  useEffect(() => {
    balanceRound.current = 0
    setCuts(getInitialCuts(totalFlow, columnCount))
    setBalanceTick(t => t + 1)
  }, [totalFlow, columnCount, paragraphs, images, highlights])

  useEffect(() => {
    if (balanceRound.current >= 180) return
    if (!cuts.length) return

    const heights = colRefs.current.slice(0, columnCount).map(col => (col ? col.offsetHeight : 0))
    if (heights.some(height => height === 0)) return

    let maxAdjacentDiff = 0
    let pivot = -1

    for (let index = 0; index < columnCount - 1; index++) {
      const diff = heights[index] - heights[index + 1]
      if (Math.abs(diff) > Math.abs(maxAdjacentDiff)) {
        maxAdjacentDiff = diff
        pivot = index
      }
    }

    if (pivot === -1 || Math.abs(maxAdjacentDiff) <= 6) {
      balanceRound.current = 0
      return
    }

    const nextCuts = [...cuts]
    const minBound = pivot === 0 ? 0 : nextCuts[pivot - 1]
    const maxBound = pivot === nextCuts.length - 1 ? totalFlow : nextCuts[pivot + 1]

    if (maxAdjacentDiff > 0) {
      if (nextCuts[pivot] > minBound) {
        nextCuts[pivot] -= 1
      } else {
        return
      }
    } else {
      if (nextCuts[pivot] < maxBound) {
        nextCuts[pivot] += 1
      } else {
        return
      }
    }

    balanceRound.current += 1
    setCuts(nextCuts)
  }, [cuts, balanceTick, columnCount, totalFlow])

  useEffect(() => {
    const observers = []
    const callback = () => {
      const heights = colRefs.current.slice(0, columnCount).map(col => (col ? col.offsetHeight : 0))
      if (heights.some(height => height === 0)) return
      const max = Math.max(...heights)
      const min = Math.min(...heights)
      if (Math.abs(max - min) <= 6) return
      // Do NOT reset balanceRound here — resetting causes an infinite loop.
      // Just trigger another balance pass if we haven't hit the cap yet.
      if (balanceRound.current < 180) setBalanceTick(t => t + 1)
    }

    colRefs.current.slice(0, columnCount).forEach(col => {
      if (!col) return
      const observer = new ResizeObserver(callback)
      observer.observe(col)
      observers.push(observer)
    })

    return () => observers.forEach(observer => observer.disconnect())
  }, [columnCount, cuts])

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

  const ranges = [...cuts, totalFlow]
  const columnItems = []
  let start = 0
  ranges.forEach(end => {
    columnItems.push(flowItems.slice(start, end))
    start = end
  })

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
        {Array.from({ length: columnCount }).map((_, columnIndex) => {
          const imageForColumn = columnIndex === 0 ? null : slotImages[columnIndex - 1]
          const textItems = columnItems[columnIndex] || []
          const extraImages = columnIndex === columnCount - 1 ? overflowImages : []

          return (
            <div className={styles.column} ref={el => { colRefs.current[columnIndex] = el }} key={`col-${columnIndex}`}>
              {columnIndex === 0 && highlights.length > 0 ? (
                <div className={styles.highlightBox}>
                  <ul>{highlights.map((item, idx) => <li key={idx}>{item}</li>)}</ul>
                </div>
              ) : null}

              {imageForColumn ? (
                <figure className={styles.articleImage}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageForColumn.src} alt={imageForColumn.alt || ''} />
                  {imageForColumn.caption ? <figcaption>{imageForColumn.caption}</figcaption> : null}
                </figure>
              ) : null}

              {extraImages.map((image, idx) => (
                <figure className={styles.articleImage} key={`extra-image-${idx}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.src} alt={image.alt || ''} />
                  {image.caption ? <figcaption>{image.caption}</figcaption> : null}
                </figure>
              ))}

              {renderContinuousFlow(
                textItems,
                `c${columnIndex + 1}`,
                columnIndex === 0 && !highlights.length && paragraphs.length > 0 ? (paragraphs[0]?.content || paragraphs[0]) : '',
                columnIndex === 0 && !highlights.length && paragraphs.length > 0
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
