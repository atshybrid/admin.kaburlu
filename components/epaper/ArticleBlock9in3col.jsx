import React, { useEffect, useRef, useState } from 'react'
import styles from './ArticleBlock9in3col.module.css'

const CATEGORY_COLORS = {
  political: '#2C3E50',
  crime: '#C0392B',
  sports: '#16A085',
  business: '#8E44AD',
  entertainment: '#D35400',
  general: '#34495E',
}

export default function ArticleBlock9in3col({
  title,
  subtitle,
  category = 'general',
  dateline = '',
  highlights = [],
  images = [],
  paragraphs = [],
}) {
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const [titleFontSize, setTitleFontSize] = useState(34)
  const [subtitleFontSize, setSubtitleFontSize] = useState(18)
  const subtitleColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.general

  useEffect(() => {
    if (!titleRef.current || !title) return
    const maxWidth = 225.8 // 9in(228.6mm) - side paddings
    const minSize = 28
    const maxSize = 44
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
      temp.style.fontSize = `${size}px`
      const width = temp.offsetWidth * 0.264583
      if (width > maxWidth) break
      currentSize = size
    }

    document.body.removeChild(temp)
    setTitleFontSize(currentSize)
  }, [title])

  useEffect(() => {
    if (!subtitleRef.current || !subtitle) return
    const maxWidth = 225.8
    const minSize = 16
    const maxSize = 24
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
      temp.style.fontSize = `${size}px`
      const width = temp.offsetWidth * 0.264583
      if (width > maxWidth) break
      currentSize = size
    }

    document.body.removeChild(temp)
    setSubtitleFontSize(currentSize)
  }, [subtitle])

  const totalParas = paragraphs.length
  const [col1End, setCol1End] = useState(Math.ceil(totalParas / 3))
  const [col2End, setCol2End] = useState(Math.ceil((totalParas * 2) / 3))
  const col1Ref = useRef(null)
  const col2Ref = useRef(null)
  const col3Ref = useRef(null)
  const balanceRound = useRef(0)

  useEffect(() => {
    balanceRound.current = 0
    setCol1End(Math.ceil(totalParas / 3))
    setCol2End(Math.ceil((totalParas * 2) / 3))
  }, [paragraphs, images, highlights, totalParas])

  useEffect(() => {
    if (!col1Ref.current || !col2Ref.current || !col3Ref.current) return
    if (balanceRound.current >= 12) return

    const h1 = col1Ref.current.offsetHeight
    const h2 = col2Ref.current.offsetHeight
    const h3 = col3Ref.current.offsetHeight

    const maxH = Math.max(h1, h2, h3)
    const minH = Math.min(h1, h2, h3)
    if (maxH - minH <= 16) {
      balanceRound.current = 0
      return
    }

    balanceRound.current += 1

    let c1 = col1End
    let c2 = col2End

    if (h1 >= h2 && h1 >= h3) {
      c1 = Math.max(1, c1 - 1)
    } else if (h3 >= h1 && h3 >= h2) {
      c2 = Math.max(c1 + 1, c2 - 1)
    } else {
      c1 = Math.min(totalParas - 2, c1 + 1)
    }

    c2 = Math.max(c1 + 1, Math.min(totalParas - 1, c2))
    setCol1End(c1)
    setCol2End(c2)
  }, [col1End, col2End, totalParas])

  const imageList = (images || []).slice(0, 4)
  const topImage2 = imageList[0]
  const topImage3 = imageList[1]
  const midImage1 = imageList[2]
  const midImage2 = imageList[3]

  const renderItemsWithMidImage = (items, keyPrefix, midImage) => {
    const midIndex = Math.floor(items.length / 2)
    return items.map((item, idx) => (
      <React.Fragment key={`${keyPrefix}-${idx}`}>
        {midImage && idx === midIndex ? (
          <figure className={styles.articleImageInline}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={midImage.src} alt={midImage.alt || ''} />
            {midImage.caption ? <figcaption>{midImage.caption}</figcaption> : null}
          </figure>
        ) : null}
        {item?.type === 'heading' ? <h3>{item.content}</h3> : <p>{item?.content || item}</p>}
      </React.Fragment>
    ))
  }

  return (
    <div className={styles.articleBlock}>
      <div className={styles.titleWrap}>
        <h1 ref={titleRef} className={styles.title} style={{ fontSize: `${titleFontSize}px` }}>
          {title}
        </h1>
        {subtitle ? (
          <h2
            ref={subtitleRef}
            className={styles.subtitle}
            style={{ fontSize: `${subtitleFontSize}px`, color: subtitleColor }}
          >
            {subtitle}
          </h2>
        ) : null}
      </div>

      <div className={styles.articleColumns}>
        <div className={styles.column} ref={col1Ref}>
          {highlights.length > 0 ? (
            <div className={styles.highlightBox}>
              <ul>{highlights.map((item, idx) => <li key={idx}>{item}</li>)}</ul>
            </div>
          ) : null}

          {!highlights.length && paragraphs.length > 0 ? (
            <p className={styles.firstPara}>
              {dateline ? <span className={styles.dateline}>{dateline} </span> : null}
              {paragraphs[0]?.content || paragraphs[0]}
            </p>
          ) : null}

          {renderItemsWithMidImage(
            paragraphs.slice(!highlights.length ? 1 : 0, col1End),
            'c1',
            midImage1
          )}
        </div>

        <div className={styles.column} ref={col2Ref}>
          {topImage2 ? (
            <figure className={styles.articleImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={topImage2.src} alt={topImage2.alt || ''} />
              {topImage2.caption ? <figcaption>{topImage2.caption}</figcaption> : null}
            </figure>
          ) : null}

          {renderItemsWithMidImage(paragraphs.slice(col1End, col2End), 'c2', midImage2)}
        </div>

        <div className={styles.column} ref={col3Ref}>
          {topImage3 ? (
            <figure className={styles.articleImage}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={topImage3.src} alt={topImage3.alt || ''} />
              {topImage3.caption ? <figcaption>{topImage3.caption}</figcaption> : null}
            </figure>
          ) : null}

          {paragraphs.slice(col2End).map((item, idx) =>
            item?.type === 'heading' ? <h3 key={`c3-${idx}`}>{item.content}</h3> : <p key={`c3-${idx}`}>{item?.content || item}</p>
          )}
        </div>
      </div>
    </div>
  )
}
