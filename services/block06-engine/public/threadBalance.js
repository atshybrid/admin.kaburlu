/**
 * BLOCK-06A — word rebalance + Quark-style vertical justify (line-leading).
 */
(function threadBalance() {
  function applyVerticalJustify(columns, bodies, maxGapPx) {
    columns.forEach((col, i) => {
      const body = bodies[i]
      if (!body) return
      body.classList.remove('force-vertical-justify')
      body.style.lineHeight = ''
    })

    const bottoms = columns.map((c) => c.getBoundingClientRect().bottom)
    const target = Math.max(...bottoms)
    const gaps = bottoms.map((b) => target - b)
    const spread = Math.max(...gaps)
    if (spread < 2 || spread > maxGapPx) return

    gaps.forEach((gap, i) => {
      if (gap < 1.5) return
      const body = bodies[i]
      const lh = parseFloat(getComputedStyle(body).lineHeight) || 14
      const lines = Math.max(1, Math.round(body.scrollHeight / lh))
      body.classList.add('force-vertical-justify')
      body.style.lineHeight = `${(lh + gap / lines).toFixed(2)}px`
    })
  }

  function balanceBlock06(article) {
    const col1 = article.querySelector('[data-column="1"]')
    const col2 = article.querySelector('[data-column="2"]')
    const col1Body = col1?.querySelector('.block06a__body')
    const col2Body = col2?.querySelector('.block06a__body')
    if (!col1 || !col2 || !col1Body || !col2Body) return

    const TOLERANCE_PX = 4
    const BALANCE_MAX = 140
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
      return col.getBoundingClientRect().bottom
    }

    function bottomSpreadPx() {
      return columnBottomPx(col2) - columnBottomPx(col1)
    }

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

    function fixCol1LastLine(all, w1) {
      applySplit(all, w1)

      for (let pass = 0; pass < 20; pass++) {
        const onLast = wordsOnLastLine(col1Body)
        if (onLast >= MIN_WORDS_LAST_LINE) break

        if (onLast <= WIDOW_MAX_WORDS && w1 < all.length - 1) {
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

    for (let pass = 0; pass < 40; pass++) {
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

    applyVerticalJustify([col1, col2], [col1Body, col2Body], 32)
    article.setAttribute('data-balance-spread', String(Math.round(bottomSpreadPx())))
  }

  function runAll() {
    document.querySelectorAll('.block06a').forEach((article) => balanceBlock06(article))
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(runAll))
  } else {
    requestAnimationFrame(runAll)
  }
})()
