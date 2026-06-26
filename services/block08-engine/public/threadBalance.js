/**
 * BLOCK-08A — DOM grid-search + vertical justify (Quark-style).
 */
(function threadBalance08() {
  function applyVerticalJustify(columns, bodies, maxGapPx) {
    bodies.forEach((body) => {
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

  function balanceBlock08(article) {
    const cols = [1, 2, 3].map((n) => article.querySelector(`[data-column="${n}"]`))
    const bodies = cols.map((c) => c?.querySelector('.block08a__body'))
    if (cols.some((c) => !c) || bodies.some((b) => !b)) return

    const TOL = 4
    const MIN_FILL = 0.72
    const PULL_TOL = 14

    function splitWords(text) {
      return String(text || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
    }

    function setBodyText(body, words) {
      const p = body.querySelector('p') || body
      p.textContent = words.join(' ')
    }

    function applySplit(all, w1, w2) {
      setBodyText(bodies[0], all.slice(0, w1))
      setBodyText(bodies[1], all.slice(w1, w1 + w2))
      setBodyText(bodies[2], all.slice(w1 + w2))
    }

    function colBottoms() {
      return cols.map((c) => c.getBoundingClientRect().bottom)
    }

    function measure(w1, w2) {
      applySplit(all, w1, w2)
      const b = colBottoms()
      const spread = Math.max(...b) - Math.min(...b)
      return { spread, score: spread }
    }

    function lastLineFill(body) {
      const p = body.querySelector('p')
      if (!p) return 1
      const text = p.textContent || ''
      const words = text.trim().split(/\s+/).filter(Boolean)
      if (!words.length) return 1
      const textNode = [...p.childNodes].find((n) => n.nodeType === Node.TEXT_NODE)
      if (!textNode) return 0.5
      const pRect = p.getBoundingClientRect()
      const range = document.createRange()
      let searchFrom = 0
      let lastTop = null
      let left = null
      let right = null
      for (const word of words) {
        const idx = text.indexOf(word, searchFrom)
        if (idx < 0) break
        try {
          range.setStart(textNode, idx)
          range.setEnd(textNode, idx + word.length)
        } catch {
          return 0.5
        }
        const r = range.getBoundingClientRect()
        if (lastTop !== null && Math.abs(r.top - lastTop) > 3) {
          left = null
          right = null
        }
        lastTop = r.top
        left = left == null ? r.left : Math.min(left, r.left)
        right = Math.max(right == null ? r.right : right, r.right)
        searchFrom = idx + word.length
      }
      if (!pRect.width || left == null) return 1
      return Math.min(1, Math.max(0, (right - left) / pRect.width))
    }

    function findBestSplit(allWords, hintW1, hintW2) {
      const n = allWords.length
      let best = { w1: hintW1, w2: hintW2, score: Infinity, spread: 999 }

      const tryCand = (w1, w2) => {
        if (w1 < 1 || w2 < 1 || w1 + w2 >= n) return
        const m = measure(w1, w2)
        if (m.score < best.score) best = { w1, w2, ...m }
      }

      const w1c = hintW1 || Math.floor(n * 0.4)
      const w2c = hintW2 || Math.floor(n * 0.28)
      for (let w1 = Math.floor(n * 0.3); w1 <= Math.floor(n * 0.55); w1 += 2) {
        for (let w2 = Math.floor(n * 0.15); w2 <= Math.min(n - w1 - 1, Math.floor(n * 0.45)); w2 += 2) {
          tryCand(w1, w2)
        }
      }
      for (let w1 = w1c - 28; w1 <= w1c + 28; w1++) {
        for (let w2 = w2c - 28; w2 <= w2c + 28; w2++) tryCand(w1, w2)
      }
      for (let pass = 0; pass < 80; pass++) {
        if (best.spread <= TOL) break
        const before = best.score
        for (const [dw1, dw2] of [
          [1, 0],
          [0, 1],
          [1, 1],
          [-1, 0],
          [0, -1],
          [-1, -1],
          [2, 0],
          [0, 2],
        ]) {
          tryCand(best.w1 + dw1, best.w2 + dw2)
        }
        if (best.score >= before - 0.01) break
      }
      return best
    }

    function fillEndLines(w1, w2) {
      const n = all.length
      for (let pass = 0; pass < 35; pass++) {
        const base = measure(w1, w2)
        let moved = false

        if (lastLineFill(bodies[0]) < MIN_FILL && w1 < n - w2 - 1) {
          const t = measure(w1 + 1, w2)
          if (t.spread <= base.spread + PULL_TOL) {
            w1 += 1
            moved = true
          }
        }
        if (lastLineFill(bodies[1]) < MIN_FILL && w1 + w2 < n - 1) {
          const t = measure(w1, w2 + 1)
          if (t.spread <= base.spread + PULL_TOL) {
            w2 += 1
            moved = true
          }
        }
        if (!moved) break
      }
      return { w1, w2 }
    }

    const all = splitWords(bodies.map((b) => b.innerText || '').join(' '))
    if (all.length < 24) return

    let hintW1 = splitWords(bodies[0].innerText || '').length
    let hintW2 = splitWords(bodies[1].innerText || '').length

    let best = findBestSplit(all, hintW1, hintW2)
    let w1 = best.w1
    let w2 = best.w2
    ;({ w1, w2 } = fillEndLines(w1, w2))
    best = findBestSplit(all, w1, w2)
    w1 = best.w1
    w2 = best.w2
    ;({ w1, w2 } = fillEndLines(w1, w2))
    applySplit(all, w1, w2)

    applyVerticalJustify(cols, bodies, 36)
    article.setAttribute('data-balance-spread', String(Math.round(measure(w1, w2).spread)))
  }

  function runAll() {
    document.querySelectorAll('.block08a').forEach((article) => balanceBlock08(article))
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(runAll))
  } else {
    requestAnimationFrame(runAll)
  }
})()
