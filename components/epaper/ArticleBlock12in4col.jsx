import React from 'react'
import Block12Article from './Block12Article'

/**
 * BLOCK-12A — 12in · 4 col threaded engine (08A rules, max 6 images).
 * Legacy props without blockCode still render BLOCK-12A.
 */
export default function ArticleBlock12in4col(props) {
  if (props.blockCode && props.blockCode !== 'BLOCK-12A') {
    return null
  }
  return <Block12Article {...props} showColumnDebug={props.showColumnDebug} />
}
