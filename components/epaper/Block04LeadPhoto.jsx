import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getBlock04PhotoLayout } from '../../lib/epaper/block04TitleMetrics'
import styles from './ArticleBlock4in2col.module.css'

export default function Block04LeadPhoto({ src, alt = '', caption = '', apiFocus = '', onReady }) {
  const imgRef = useRef(null)
  const [layout, setLayout] = useState({
    aspect: '1 / 1',
    focus: apiFocus || '50% 25%',
    mode: 'square',
    objectFit: 'cover',
  })

  const onLoad = useCallback(
    (e) => {
      const img = e.currentTarget
      const next = getBlock04PhotoLayout(img.naturalWidth, img.naturalHeight, apiFocus)
      setLayout(next)
      onReady?.()
    },
    [apiFocus, onReady]
  )

  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) onReady?.()
  }, [src, onReady])

  return (
    <figure className={styles.articleImage}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={styles.photo}
        data-ratio={layout.mode === 'landscape' ? '2' : layout.mode === 'portrait' ? '3' : layout.mode === 'standard' ? '4' : '1'}
        style={{
          aspectRatio: layout.aspect,
          objectFit: layout.objectFit || 'cover',
          objectPosition: layout.focus,
        }}
        onLoad={onLoad}
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
