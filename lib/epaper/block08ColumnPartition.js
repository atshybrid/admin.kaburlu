/**
 * BLOCK-08A — partition body across 3 grid columns (even bottoms, no blank flex filler).
 */

function indicesRange(start, end) {
  if (end < start) return []
  const out = []
  for (let i = start; i <= end; i++) out.push(i)
  return out
}

function columnBottomPx(indices, colIndex, obstacles, measureColumnText) {
  const obs = obstacles[colIndex] || 0
  if (!indices.length) return obs
  return obs + measureColumnText(indices, colIndex)
}

function balanceAssignments(
  assignments,
  bodyItems,
  obstaclePx,
  measureColumnText,
  colCount,
  { tolerancePx = 4, maxPasses = 80 } = {}
) {
  const result = assignments.map((a) => [...a])

  const bottoms = () =>
    Array.from({ length: colCount }, (_, col) =>
      columnBottomPx(result[col], col, obstaclePx, measureColumnText)
    )

  for (let pass = 0; pass < maxPasses; pass++) {
    const b = bottoms()
    const spread = Math.max(...b) - Math.min(...b)
    if (spread <= tolerancePx) break

    let moved = false

    for (let from = colCount - 1; from > 0; from--) {
      if (b[from] <= b[from - 1] + tolerancePx) continue
      if (!result[from].length) continue
      const idx = result[from][result[from].length - 1]
      result[from].pop()
      result[from - 1].push(idx)
      moved = true
      break
    }

    if (!moved) {
      for (let from = 0; from < colCount - 1; from++) {
        const b2 = bottoms()
        if (b2[from] <= b2[from + 1] + tolerancePx) continue
        if (!result[from].length) continue
        const idx = result[from][result[from].length - 1]
        result[from].pop()
        result[from + 1].push(idx)
        moved = true
        break
      }
    }

    if (!moved) break
  }

  return result
}

/**
 * Target-fill: each column gets text budget = avgBottom - obstacle (col2 with image gets less text).
 */
export function partitionBodyByTargetFill(
  bodyItems,
  obstaclePx,
  measureColumnText,
  colCount = 3
) {
  const n = bodyItems.length
  const empty = Array.from({ length: colCount }, () => [])
  if (!n) return empty

  if (n === 1) {
    const assignments = Array.from({ length: colCount }, () => [])
    const obs = obstaclePx.map((o) => o || 0)
    const minCol = obs.indexOf(Math.min(...obs))
    assignments[minCol].push(0)
    return assignments
  }

  let totalText = 0
  for (let i = 0; i < n; i++) {
    totalText += measureColumnText([i], 0)
  }
  const totalObs = obstaclePx.reduce((a, b) => a + (b || 0), 0)
  const targetBottom = (totalText + totalObs) / colCount

  const assignments = Array.from({ length: colCount }, () => [])
  let p = 0

  for (let col = 0; col < colCount && p < n; col++) {
    const textBudget = Math.max(48, targetBottom - (obstaclePx[col] || 0))
    const isLast = col === colCount - 1

    while (p < n) {
      const trial = [...assignments[col], p]
      const h = measureColumnText(trial, col)

      if (isLast) {
        assignments[col].push(p)
        p++
        continue
      }

      if (h <= textBudget * 1.08) {
        assignments[col].push(p)
        p++
        if (h >= textBudget * 0.88) break
      } else {
        break
      }
    }
  }

  while (p < n) {
    assignments[colCount - 1].push(p++)
  }

  return balanceAssignments(assignments, bodyItems, obstaclePx, measureColumnText, colCount)
}

/**
 * Brute-force even bottoms (reading order col1→col2→col3).
 */
export function partitionBodyForEvenBottoms(
  bodyItems,
  obstaclePx,
  measureColumnText,
  colCount = 3
) {
  const n = bodyItems.length
  if (!n) return Array.from({ length: colCount }, () => [])

  if (colCount !== 3 || n < 3) {
    return partitionBodyByTargetFill(bodyItems, obstaclePx, measureColumnText, colCount)
  }

  let bestSpread = Infinity
  let bestEnd0 = 0
  let bestEnd1 = 0

  for (let end0 = 0; end0 <= n - 3; end0++) {
    for (let end1 = end0 + 1; end1 <= n - 2; end1++) {
      const bottoms = [
        columnBottomPx(indicesRange(0, end0), 0, obstaclePx, measureColumnText),
        columnBottomPx(indicesRange(end0 + 1, end1), 1, obstaclePx, measureColumnText),
        columnBottomPx(indicesRange(end1 + 1, n - 1), 2, obstaclePx, measureColumnText),
      ]
      const spread = Math.max(...bottoms) - Math.min(...bottoms)
      if (spread < bestSpread) {
        bestSpread = spread
        bestEnd0 = end0
        bestEnd1 = end1
      }
    }
  }

  const brute = [
    indicesRange(0, bestEnd0),
    indicesRange(bestEnd0 + 1, bestEnd1),
    indicesRange(bestEnd1 + 1, n - 1),
  ]

  const target = partitionBodyByTargetFill(bodyItems, obstaclePx, measureColumnText, colCount)

  const spreadBrute = (() => {
    const b = brute.map((idx, col) =>
      columnBottomPx(idx, col, obstaclePx, measureColumnText)
    )
    return Math.max(...b) - Math.min(...b)
  })()

  const spreadTarget = (() => {
    const b = target.map((idx, col) =>
      columnBottomPx(idx, col, obstaclePx, measureColumnText)
    )
    return Math.max(...b) - Math.min(...b)
  })()

  const pick = spreadTarget <= spreadBrute ? target : brute
  return balanceAssignments(pick, bodyItems, obstaclePx, measureColumnText, colCount)
}

export function refineAssignmentsFromDomHeights(
  assignments,
  domHeights,
  { tolerancePx = 10 } = {}
) {
  const spread = Math.max(...domHeights) - Math.min(...domHeights)
  if (spread <= tolerancePx) return assignments

  const next = assignments.map((a) => [...a])
  const maxCol = domHeights.indexOf(Math.max(...domHeights))
  const minCol = domHeights.indexOf(Math.min(...domHeights))
  if (maxCol <= minCol || !next[maxCol].length) return assignments

  const to = maxCol > minCol ? maxCol - 1 : maxCol + 1
  if (to < 0 || to >= next.length) return assignments

  const idx = next[maxCol][next[maxCol].length - 1]
  next[maxCol].pop()
  next[to].push(idx)
  return next
}
