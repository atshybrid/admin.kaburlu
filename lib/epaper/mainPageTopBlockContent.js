import { splitBodyForTopBlock } from './mainPageTopBlockRules'
import { balanceBodyColumnsEven } from './mainPageTopBodyColumns'

/**
 * Resolve 2-column body + optional quote for BLOCK-TOP8x7.
 * Explicit column strings win over auto-split from paragraphs.
 */
export function resolveTopBlockBody({
  bodyArticleText,
  bodyLeftText,
  bodyRightText,
  bodyQuoteText,
  paragraphs = [],
  quoteText = '',
  skipFirstParagraph = false,
} = {}) {
  const singleArticle = String(bodyArticleText ?? '').trim()
  if (singleArticle) {
    return {
      left: singleArticle,
      right: '',
      quote: String(bodyQuoteText ?? quoteText ?? ''),
    }
  }

  const hasExplicit =
    bodyLeftText != null || bodyRightText != null || bodyQuoteText != null

  if (hasExplicit) {
    const left = String(bodyLeftText ?? '')
    const right = String(bodyRightText ?? '')
    const quote = String(bodyQuoteText ?? quoteText ?? '')
    if (left && right) {
      return { left, right, quote }
    }
    const merged = [left, right, quote].filter(Boolean).join(' ')
    if (merged && (!left || !right)) {
      const balanced = balanceBodyColumnsEven(merged)
      return { left: left || balanced.left, right: right || balanced.right, quote: '' }
    }
    return { left, right, quote }
  }

  return splitBodyForTopBlock(paragraphs, quoteText, { skipFirstParagraph })
}

/** One-time seed for studio / page state from article paragraphs. */
export function seedTopBlockBodyColumns({
  paragraphs = [],
  quoteText = '',
  skipFirstParagraph = false,
} = {}) {
  const split = splitBodyForTopBlock(paragraphs, quoteText, { skipFirstParagraph })
  return {
    bodyLeftText: split.left,
    bodyRightText: split.right,
    bodyQuoteText: split.quote,
  }
}
