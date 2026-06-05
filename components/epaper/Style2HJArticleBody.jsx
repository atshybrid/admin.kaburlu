import React, { useMemo } from 'react'
import styles from './MainPageTopBlock.module.css'
import b08 from './Block08Article.module.css'
import {
  normalizeStyle2ArticleText,
  splitStyle2ArticleParagraphs,
  estimateStyle2ArticleColWidthPx,
} from '../../lib/epaper/mainPageTopStyle2Text'

/**
 * Style 2 article — same H&J as reference / Block08 (justify, narrow spacing).
 * Body ~12.5px; avoids 18px CSS justify “rivers” between words.
 */
export default function Style2ArticleBody({
  articleText = '',
  fontSizePx = 12.5,
  lineHeight = 1.48,
  fontFamily = "'Mandali', sans-serif",
  style = {},
}) {
  const paragraphs = useMemo(() => {
    const normalized = normalizeStyle2ArticleText(articleText)
    return splitStyle2ArticleParagraphs(normalized)
  }, [articleText])

  const lineH = Math.ceil(fontSizePx * lineHeight)

  if (!paragraphs.length) return null

  return (
    <div
      className={styles.style2ArticleColInner}
      style={{
        fontFamily,
        fontSize: `${fontSizePx}px`,
        lineHeight: `${lineH}px`,
        minHeight: '100%',
        ...style,
      }}
      lang="te"
    >
      {paragraphs.map((para, i) => {
        const isLast = i === paragraphs.length - 1
        const pClass = isLast
          ? `${b08.hjBodyColumnEnd} ${styles.style2ArticleHjPara}`
          : `${b08.hjBodyColumn} ${styles.style2ArticleHjPara}`
        return (
          <p
            key={i}
            className={pClass}
            style={{
              fontFamily,
              fontSize: `${fontSizePx}px`,
              lineHeight: `${lineH}px`,
            }}
          >
            {para}
          </p>
        )
      })}
    </div>
  )
}

export { estimateStyle2ArticleColWidthPx }
