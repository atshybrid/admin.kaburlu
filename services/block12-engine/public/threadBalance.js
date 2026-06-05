/**
 * BLOCK-12A v1.4 — align TEXT body bottoms across 4 columns.
 */
(function threadBalance12() {
  const article = document.querySelector('.block12a')
  if (!article) return

  const cols = [1, 2, 3, 4].map((n) => article.querySelector(`[data-column="${n}"]`))
  const bodies = cols.map((c) => c?.querySelector('.block12a__body'))
  if (cols.some((c) => !c) || bodies.some((b) => !b)) return

  const TOL = 3
  const MIN_FILL = 0.65

  function splitWords(text) {
    return String(text || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
  }

  function setBodyText(body, words) {
    body.innerHTML = ''
    const p = document.createElement('p')
    p.className = 'block12a__para'
    p.textContent = words.join(' ')
    body.appendChild(p)
  }

  function applySplit(all, w1, w2, w3) {
    setBodyText(bodies[0], all.slice(0, w1))
    setBodyText(bodies[1], all.slice(w1, w1 + w2))
    setBodyText(bodies[2], all.slice(w1 + w2, w1 + w2 + w3))
    setBodyText(bodies[3], all.slice(w1 + w2 + w3))
  }

  function bodyBottoms() {
    return bodies.map((b) => b.getBoundingClientRect().bottom)
  }

  function bodySpread() {
    const bb = bodyBottoms()
    return { spread: Math.max(...bb) - Math.min(...bb), bottoms: bb }
  }

  function validSplit(n, w1, w2, w3) {
    return w1 >= 1 && w2 >= 1 && w3 >= 1 && w1 + w2 + w3 < n
  }

  const MOVES = [
    [1, -1, 0],
    [2, -2, 0],
    [3, -3, 0],
    [0, 1, -1],
    [0, 2, -2],
    [0, 0, 1],
    [0, 0, -1],
    [-1, 1, 0],
    [0, -1, 1],
    [1, 0, -1],
  ]

  function forceBodyAlign(w1, w2, w3) {
    const n = all.length
    for (let pass = 0; pass < 300; pass++) {
      applySplit(all, w1, w2, w3)
      const { spread, bottoms } = bodySpread()
      if (spread <= TOL) break

      const maxB = Math.max(...bottoms)
      let moved = false

      if (bottoms[0] < maxB - TOL && w2 > 1) {
        w1++
        w2--
        moved = true
      } else if (bottoms[1] < maxB - TOL && w3 > 1) {
        w2++
        w3--
        moved = true
      } else if (bottoms[2] < maxB - TOL && w1 + w2 + w3 < n - 1) {
        w3++
        moved = true
      } else if (bottoms[3] < maxB - TOL && w3 > 1) {
        w3--
        moved = true
      } else {
        let best = null
        for (const [d1, d2, d3] of MOVES) {
          const nw1 = w1 + d1
          const nw2 = w2 + d2
          const nw3 = w3 + d3
          if (!validSplit(n, nw1, nw2, nw3)) continue
          applySplit(all, nw1, nw2, nw3)
          const s = bodySpread().spread
          if (!best || s < best.spread) best = { w1: nw1, w2: nw2, w3: nw3, spread: s }
        }
        if (best && best.spread < spread) {
          w1 = best.w1
          w2 = best.w2
          w3 = best.w3
          moved = true
        }
      }
      if (!moved) break
    }
    return { w1, w2, w3 }
  }

  function lastLineFill(w1, w2, w3) {
    const p = (body) => body.querySelector('p')
    function fill(body) {
      const el = p(body)
      if (!el) return 1
      const text = el.textContent || ''
      const words = text.trim().split(/\s+/).filter(Boolean)
      if (!words.length) return 1
      const textNode = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE)
      if (!textNode) return 0.5
      const pRect = el.getBoundingClientRect()
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
    const n = all.length
    for (let pass = 0; pass < 25; pass++) {
      applySplit(all, w1, w2, w3)
      let moved = false
      if (fill(bodies[0]) < MIN_FILL && validSplit(n, w1 + 1, w2, w3)) {
        w1++
        moved = true
      }
      if (fill(bodies[1]) < MIN_FILL && validSplit(n, w1, w2 + 1, w3)) {
        w2++
        moved = true
      }
      if (fill(bodies[2]) < MIN_FILL && validSplit(n, w1, w2, w3 + 1)) {
        w3++
        moved = true
      }
      if (!moved) break
    }
    return { w1, w2, w3 }
  }

  const all = splitWords(bodies.map((b) => b.innerText || '').join(' '))
  if (all.length < 20) return

  let w1 = Number(article.dataset.w1) || Math.floor(all.length * 0.38)
  let w2 = Number(article.dataset.w2) || Math.floor(all.length * 0.22)
  let w3 = Number(article.dataset.w3) || Math.floor(all.length * 0.2)
  if (!validSplit(all.length, w1, w2, w3)) {
    w1 = Math.floor(all.length * 0.35)
    w2 = Math.floor(all.length * 0.22)
    w3 = Math.floor(all.length * 0.22)
  }

  function waitImages() {
    const imgs = [...article.querySelectorAll('.block12a__grid img')]
    return Promise.all(
      imgs.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalHeight > 0) resolve()
            else {
              img.addEventListener('load', resolve, { once: true })
              img.addEventListener('error', resolve, { once: true })
            }
          })
      )
    )
  }

  function run() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ;({ w1, w2, w3 } = forceBodyAlign(w1, w2, w3))
        ;({ w1, w2, w3 } = fillEndLines(w1, w2, w3))
        ;({ w1, w2, w3 } = forceBodyAlign(w1, w2, w3))
        applySplit(all, w1, w2, w3)
        const fin = bodySpread()
        article.setAttribute('data-balance-spread', String(Math.round(fin.spread)))
        article.setAttribute('data-balance-w', `${w1}/${w2}/${w3}/${all.length - w1 - w2 - w3}`)
      })
    })
  }

  async function start() {
    if (document.fonts?.ready) await document.fonts.ready
    await waitImages()
    run()
    setTimeout(run, 120)
  }

  start()
})()
