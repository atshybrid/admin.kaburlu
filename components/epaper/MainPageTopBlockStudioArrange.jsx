import React from 'react'
import { ARRANGE_ACTIONS } from '../../lib/epaper/mainPageTopBlockStack'
import tb from './MainPageTopBlockStudio.module.css'

const BTNS = [
  { action: ARRANGE_ACTIONS.front, label: 'Bring to front', title: 'Bring to front (Shift+])' },
  { action: ARRANGE_ACTIONS.forward, label: 'Forward', title: 'Bring forward (])' },
  { action: ARRANGE_ACTIONS.backward, label: 'Backward', title: 'Send backward ([)' },
  { action: ARRANGE_ACTIONS.back, label: 'Send to back', title: 'Send to back (Shift+[)' },
]

export default function MainPageTopBlockStudioArrange({
  selectedLayer,
  canArrange,
  onArrange,
}) {
  return (
    <div className={tb.arrangeBar} role="toolbar" aria-label="Arrange layers">
      <span className={tb.arrangeLabel}>Arrange</span>
      {BTNS.map((b) => (
        <button
          key={b.action}
          type="button"
          className={tb.arrangeBtn}
          title={b.title}
          disabled={!canArrange}
          onClick={() => onArrange(b.action)}
        >
          {b.label}
        </button>
      ))}
    </div>
  )
}
