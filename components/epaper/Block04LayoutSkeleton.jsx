import React from 'react'
import sk from './blockLayoutSkeleton.module.css'

/** BLOCK-04A — photo + body rail skeleton until title fit + image load. */
export default function Block04LayoutSkeleton({ showImage = true }) {
  return (
    <div className={sk.railSkeleton} aria-hidden>
      {showImage ? <div className={sk.railSkeletonImage} /> : null}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
        <div key={j} className={sk.skeletonLine} />
      ))}
    </div>
  )
}
