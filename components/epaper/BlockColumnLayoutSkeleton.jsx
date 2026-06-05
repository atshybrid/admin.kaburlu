import React from 'react'
import sk from './blockLayoutSkeleton.module.css'

/**
 * Placeholder grid while BLOCK-06A / BLOCK-08A column text is partitioning.
 */
export default function BlockColumnLayoutSkeleton({
  columns = 3,
  imageColumnIndex = 1,
  imageColumnIndexes = null,
  columnGap,
}) {
  const colClass = columns === 2 ? sk.layoutSkeletonCols2 : sk.layoutSkeletonCols3
  const imageCols = Array.isArray(imageColumnIndexes)
    ? imageColumnIndexes
    : imageColumnIndex >= 0
      ? [imageColumnIndex]
      : []

  return (
    <div
      className={`${sk.layoutSkeleton} ${colClass}`}
      style={columnGap != null ? { '--col-gap': `${columnGap}px` } : undefined}
      aria-hidden
    >
      {Array.from({ length: columns }, (_, i) => (
        <div key={i} className={sk.skeletonColumn}>
          {imageCols.includes(i) ? <div className={sk.skeletonBlock} /> : null}
          {[0, 1, 2, 3, 4, 5, 6].map((j) => (
            <div key={j} className={sk.skeletonLine} />
          ))}
        </div>
      ))}
    </div>
  )
}
