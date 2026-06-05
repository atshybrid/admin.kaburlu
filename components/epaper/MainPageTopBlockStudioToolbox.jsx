import React from 'react'
import { STUDIO_TOOLS } from '../../lib/epaper/mainPageTopBlockTransform'
import tb from './MainPageTopBlockStudio.module.css'

const ICONS = {
  select: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M4 4l14 14-4.5 1L9 19.5 7 13 4 4z" />
    </svg>
  ),
  text: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M5 4h14v3h-5v13h-4V7H5V4z" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M5 5h14v14H5V5zm2 2v10h10V7H7zm1.5 6.5l2-2.5 2 2.5 2.5-3.5L16 14H8l.5-2.5z" />
    </svg>
  ),
  zone: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
    </svg>
  ),
}

export default function MainPageTopBlockStudioToolbox({ activeTool, onToolChange }) {
  return (
    <div className={tb.toolbox} role="toolbar" aria-label="Design tools">
      {Object.values(STUDIO_TOOLS).map((tool) => (
        <button
          key={tool.id}
          type="button"
          title={`${tool.label} (${tool.shortcut})`}
          className={`${tb.toolBtn} ${activeTool === tool.id ? tb.toolBtnActive : ''}`}
          onClick={() => onToolChange(tool.id)}
        >
          {ICONS[tool.id]}
          <span className={tb.toolShortcut}>{tool.shortcut}</span>
        </button>
      ))}
    </div>
  )
}
