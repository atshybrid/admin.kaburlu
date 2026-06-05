import React, { useLayoutEffect, useRef } from 'react'
import styles from './Block08Article.module.css'
import { normalizeFlowText } from '../../lib/epaper/block08BodyTypography'
import { ensureBlock08BodyFonts } from '../../lib/epaper/block08TextMetrics'

/**
 * Column body — CSS H&J Narrow for display (Quark-like inter-word justify).
 * Line composer is used only for column-height / threading measure.
 */
export default function Block08ColumnBody({
  text = '',
  columnIndex = 0,
  terminalColumnIndex = 2,
  dateline = '',
  showDateline = false,
  className = '',
}) {
  const measureRef = useRef(null)
  const body = normalizeFlowText(text)
  const isFinalColumn = columnIndex >= terminalColumnIndex

  useLayoutEffect(() => {
    ensureBlock08BodyFonts()
  }, [])

  if (!body) return null

  const pClass = isFinalColumn ? styles.hjBodyColumnEnd : styles.hjBodyColumn

  return (
    <p ref={measureRef} className={`${pClass} ${className}`.trim()} lang="te">
      {showDateline && dateline ? <span className={styles.dateline}>{dateline} </span> : null}
      {body}
    </p>
  )
}
