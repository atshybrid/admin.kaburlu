import React from 'react'
import MainPageTopBlock from './MainPageTopBlock'
import { BLOCK_TOP8X7_CODE } from '../../lib/epaper/mainPageTopBlockRules'

/** BLOCK-TOP8x7 — 8in × 7in main page top block router. */
export default function ArticleBlockMainPageTop(props) {
  if (props.blockCode && props.blockCode !== BLOCK_TOP8X7_CODE) return null
  return <MainPageTopBlock {...props} />
}
