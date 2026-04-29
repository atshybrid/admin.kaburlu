import React, { useEffect, useRef, useState } from 'react'
import styles from './ArticleBlock4in2col.module.css'

const CATEGORY_COLORS = {
  political: '#2C3E50',
  crime: '#C0392B',
  sports: '#16A085',
  business: '#8E44AD',
  entertainment: '#D35400',
  general: '#34495E',
}

// 4-inch wide, 2-column article block
export default function ArticleBlock4in2col({
  title,
  subtitle,
  category = 'general',
  dateline = '',
  highlights = [],
  images = [],
  paragraphs = [],
}) {
  const titleRef = useRef(null)
  const [titleFontSize, setTitleFontSize] = useState(22)
  const subtitleColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.general

  // 4in = 101.6mm, minus 4mm each side = 93.6mm available
  useEffect(() => {
    if (!titleRef.current || !title) return
    const maxWidth = 93.6
    const minSize = 18
    const maxSize = 28
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
  const flowStart = highlights.length ? 0 : 1
  const flowItems = paragraphs.slice(flowStart)
  const totalFlow = flowItems.length
  const flowItemsRef = useRef(flowItems)
  const totalFlowRef = useRef(totalFlow)
  useEffect(() => {
    flowItemsRef.current = flowItems
    totalFlowRef.current = totalFlow
  }, [flowItems, totalFlow])

  const [splitIndex, setSplitIndex] = useState(Math.ceil(totalFlow / 2))
  const [splitWords, setSplitWords] = useState(0)
  const [balanceTick, setBalanceTick] = useState(0)
  const col1Ref = useRef(null)
  const col2Ref = useRef(null)
  const balanceRound = useRef(0)

  // Reset on content change
  useEffect(() => {
    balanceRound.current = 0
    setSplitIndex(Math.ceil(totalFlow / 2))
    setSplitWords(0)
    setBalanceTick(t => t + 1)
  }, [paragraphs, images, highlights, totalFlow])

  // Iterative balance — fires on col1End change OR tick
  useEffect(() => {
    if (!col1Ref.current || !col2Ref.current) return
    if (balanceRound.current >= 120) return
    const h1 = col1Ref.current.offsetHeight
    const h2 = col2Ref.current.offsetHeight
    if (Math.abs(h1 - h2) <= 6) { balanceRound.current = 0; return }

    balanceRound.current++
    const currentItems = flowItemsRef.current

    if (h1 < h2) {
      const nextItem = currentItems[splitIndex]
      if (!nextItem) return
      if (nextItem.type === 'heading') {
        setSplitIndex(prev => Math.min(totalFlowRef.current, prev + 1))
        setSplitWords(0)
        return
      }
      const text = (nextItem.content || nextItem || '').trim()
      const words = text ? text.split(/\s+/) : []
      if (!words.length) {
        setSplitIndex(prev => Math.min(totalFlowRef.current, prev + 1))
        setSplitWords(0)
        return
      }
      if (splitWords < words.length - 6) {
        setSplitWords(prev => Math.min(words.length, prev + 6))
      } else {
        setSplitIndex(prev => Math.min(totalFlowRef.current, prev + 1))
        setSplitWords(0)
      }
      return
    }

    if (splitWords > 0) {
      setSplitWords(prev => Math.max(0, prev - 6))
      return
    }

    if (splitIndex <= 0) return
    const prevItem = currentItems[splitIndex - 1]
    if (prevItem?.type === 'heading') {
      setSplitIndex(prev => Math.max(0, prev - 1))
      setSplitWords(0)
      return
    }
    const prevText = (prevItem?.content || prevItem || '').trim()
    const prevWords = prevText ? prevText.split(/\s+/) : []
    if (!prevWords.length) {
      setSplitIndex(prev => Math.max(0, prev - 1))
      setSplitWords(0)
      return
    }
    setSplitIndex(prev => Math.max(0, prev - 1))
    setSplitWords(Math.max(0, prevWords.length - 6))
  }, [splitIndex, splitWords, balanceTick])

  // ResizeObserver: always fires a tick when col2 height changes (image load, font load)
  useEffect(() => {
    if (!col2Ref.current) return
    const ro = new ResizeObserver(() => {
      if (!col1Ref.current || !col2Ref.current) return
      const h1 = col1Ref.current.offsetHeight
      const h2 = col2Ref.current.offsetHeight
      if (Math.abs(h1 - h2) <= 18) return
      balanceRound.current = 0
      setBalanceTick(t => t + 1) // always a new value → always re-triggers balance effect
    })
    ro.observe(col2Ref.current)
    return () => ro.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
        {(() => {
          const leftItems = flowItems.slice(0, splitIndex)
          const rightItems = flowItems.slice(splitIndex)
          const firstRight = rightItems[0]
          const canSplitFirstRight =
            splitWords > 0 &&
            firstRight &&
            firstRight.type !== 'heading' &&
            (firstRight.content || firstRight)
          const splitSource = canSplitFirstRight ? String(firstRight.content || firstRight).trim() : ''
          const splitSourceWords = splitSource ? splitSource.split(/\s+/) : []
          const leftSplitText = canSplitFirstRight
            ? splitSourceWords.slice(0, Math.min(splitWords, splitSourceWords.length)).join(' ')
            : ''
          const rightSplitText = canSplitFirstRight
            ? splitSourceWords.slice(Math.min(splitWords, splitSourceWords.length)).join(' ')
            : ''
          const rightRemainingItems = rightItems.slice(canSplitFirstRight ? 1 : 0)
          const firstRightRemaining = rightRemainingItems[0]
          const canMergeRightSplit =
            canSplitFirstRight &&
            rightSplitText &&
            firstRightRemaining &&
            firstRightRemaining.type !== 'heading'
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

          const leftFlowItems = leftSplitText ? [...leftItems, { content: leftSplitText }] : leftItems
          const rightFlowItems = canMergeRightSplit
            ? [{ content: `${rightSplitText} ${firstRightRemaining.content || firstRightRemaining}` }, ...rightRemainingItems.slice(1)]
            : [
                ...(canSplitFirstRight && rightSplitText ? [{ content: rightSplitText }] : []),
                ...rightRemainingItems,
              ]

          return (
            <>
        {/* COLUMN 1 */}
        <div className={styles.column} ref={col1Ref}>
          {highlights.length > 0 ? (
            <div className={styles.highlightBox}>
              <ul>{highlights.map((item, idx) => <li key={idx}>{item}</li>)}</ul>
            </div>
          ) : null}
          {renderContinuousFlow(
            leftFlowItems,
            'c1',
            !highlights.length && paragraphs.length > 0 ? (paragraphs[0]?.content || paragraphs[0]) : '',
            !highlights.length && paragraphs.length > 0
          )}
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
          {renderContinuousFlow(rightFlowItems, 'c2')}
        </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}
