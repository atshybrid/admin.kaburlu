import React from 'react'
import Head from 'next/head'
import ArticleBlock2in1col from '../../components/epaper/ArticleBlock2in1col'
import { DEFAULT_EPAPER_DEMO_ARTICLE_ID, fetchEpaperDemoArticle } from '../../lib/server/epaperDemo'

const ARTICLE_ID = DEFAULT_EPAPER_DEMO_ARTICLE_ID

function mapArticleToBlock(data) {
  const paragraphs = (data.content || '')
    .split(/\n\n+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(text => ({ content: text }))

  const images = (data.mediaUrls || [])
    .filter(Boolean)
    .slice(0, 1)
    .map(url => ({ src: url, alt: data.title || '', caption: '' }))

  return {
    title: data.title || '',
    subtitle: data.subTitle || null,
    category: 'general',
    dateline: data.dateline || '',
    highlights: Array.isArray(data.points) ? data.points : [],
    images,
    paragraphs,
  }
}

export default function Demo({ articleProps, error }) {
  if (error) return <div style={{ padding: 40, color: 'red' }}><b>Error:</b> {error}</div>

  return (
    <>
      <Head><title>2in 1col Block Demo</title></Head>
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px 0' }}>
        <ArticleBlock2in1col {...articleProps} />
      </div>
    </>
  )
}

export async function getServerSideProps({ req }) {
  try {
    const result = await fetchEpaperDemoArticle(req, ARTICLE_ID)
    if (!result.ok) return { props: { articleProps: null, error: result.error } }
    const data = result.data
    return { props: { articleProps: mapArticleToBlock(data), error: null } }
  } catch (err) {
    return { props: { articleProps: null, error: err.message } }
  }
}
