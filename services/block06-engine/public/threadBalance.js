/**
 * After render: align column bottoms, then fix col1 short last line (widow).
 */
(function threadBalance() {
  const article = document.querySelector('.block06a')
  if (!article) return

  const col1 = article.querySelector('[data-column="1"]')
  const col2 = article.querySelector('[data-column="2"]')
  const col1Body = col1?.querySelector('.block06a__body')
  const col2Body = col2?.querySelector('.block06a__body')
  if (!col1 || !col2 || !col1Body || !col2Body) return

  const TOLERANCE_PX = 5
  const BALANCE_MAX = 120
  const WIDOW_MAX_WORDS = 2
  const MIN_WORDS_LAST_LINE = 3

  function splitWords(text) {
    return String(text || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
  }

  function setBodyText(body, words) {
    const text = words.join(' ')
    const p = body.querySelector('p') || body
    p.textContent = text
  }

  function columnBottomPx(col) {
    const body = col.querySelector('.block06a__body')
    if (!body) return col.getBoundingClientRect().bottom
    return body.getBoundingClientRect().bottom
  }

  function bottomSpreadPx() {
    return columnBottomPx(col2) - columnBottomPx(col1)
  }

  /** Words on the last visual line of col1 body (Range API). */
  function wordsOnLastLine(body) {
    const p = body.querySelector('p')
    if (!p) return 0
    const text = p.textContent || ''
    const words = text.trim().split(/\s+/).filter(Boolean)
    if (!words.length) return 0

    const textNode = [...p.childNodes].find((n) => n.nodeType === Node.TEXT_NODE)
    if (!textNode) return words.length

    const range = document.createRange()
    let searchFrom = 0
    let lastTop = null
    let countOnLastLine = 0

    for (const word of words) {
      const idx = text.indexOf(word, searchFrom)
      if (idx < 0) break
      try {
        range.setStart(textNode, idx)
        range.setEnd(textNode, idx + word.length)
      } catch {
        return words.length
      }
      const top = range.getBoundingClientRect().top
      if (lastTop !== null && Math.abs(top - lastTop) > 3) {
        countOnLastLine = 0
      }
      lastTop = top
      countOnLastLine += 1
      searchFrom = idx + word.length
    }
    return countOnLastLine
  }

  function applySplit(all, w1) {
    setBodyText(col1Body, all.slice(0, w1))
    setBodyText(col2Body, all.slice(w1))
  }

  /** Pull words from col2 into col1 to fill short last line; else move orphan to col2. */
  function fixCol1LastLine(all, w1) {
    applySplit(all, w1)

    for (let pass = 0; pass < 20; pass++) {
      const onLast = wordsOnLastLine(col1Body)
      if (onLast >= MIN_WORDS_LAST_LINE) break

      if (onLast <= WIDOW_MAX_WORDS && w1 < all.length - 1) {
        const spreadBefore = bottomSpreadPx()
        w1 += 1
        applySplit(all, w1)
        if (Math.abs(bottomSpreadPx()) <= TOLERANCE_PX + 18) continue
        w1 -= 1
        applySplit(all, w1)
      }

      if (wordsOnLastLine(col1Body) <= WIDOW_MAX_WORDS && w1 > 1) {
        w1 -= 1
        applySplit(all, w1)
        if (Math.abs(bottomSpreadPx()) > TOLERANCE_PX + 18) {
          w1 += 1
          applySplit(all, w1)
        }
      }
      break
    }

    return w1
  }

  const all = splitWords(`${col1Body.innerText || ''} ${col2Body.innerText || ''}`)
  if (all.length < 16) return

  let w1 = splitWords(col1Body.innerText || '').length
  w1 = Math.max(1, Math.min(all.length - 1, w1))

  const run = () => {
    applySplit(all, w1)

    for (let pass = 0; pass < BALANCE_MAX; pass++) {
      const spread = bottomSpreadPx()
      if (Math.abs(spread) <= TOLERANCE_PX) break

      if (spread > TOLERANCE_PX && w1 < all.length - 1) {
        w1 += 1
      } else if (spread < -TOLERANCE_PX && w1 > 1) {
        w1 -= 1
      } else {
        break
      }
      applySplit(all, w1)
    }

    w1 = fixCol1LastLine(all, w1)

    for (let pass = 0; pass < 30; pass++) {
      const spread = bottomSpreadPx()
      if (Math.abs(spread) <= TOLERANCE_PX) break
      if (spread > TOLERANCE_PX && w1 < all.length - 1) {
        w1 += 1
      } else if (spread < -TOLERANCE_PX && w1 > 1) {
        w1 -= 1
      } else {
        break
      }
      applySplit(all, w1)
    }

  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(run)
  } else {
    requestAnimationFrame(run)
  }
})()
