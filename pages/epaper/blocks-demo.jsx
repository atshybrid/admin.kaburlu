import React from 'react'
import Head from 'next/head'
import ClassicArticleBlock from '../../components/epaper/ClassicArticleBlock'
import ArticleBlock2in1col from '../../components/epaper/ArticleBlock2in1col'
import ArticleBlock3in1col from '../../components/epaper/ArticleBlock3in1col'
import ArticleBlock4in2col from '../../components/epaper/ArticleBlock4in2col'
import ArticleBlock6in2col from '../../components/epaper/ArticleBlock6in2col'
import ArticleBlock9in3col from '../../components/epaper/ArticleBlock9in3col'
import ArticleBlock12in4col from '../../components/epaper/ArticleBlock12in4col'
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

const LABEL_STYLE = {
  fontFamily: 'sans-serif',
  fontSize: 11,
  fontWeight: 600,
  color: '#64748b',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 8,
  paddingLeft: 2,
}

const SECTION_STYLE = {
  marginBottom: 40,
  overflowX: 'auto',
}

export default function BlocksDemo({ articleProps, error }) {
  if (error) {
    return (
      <div style={{ padding: 40, color: 'red', fontFamily: 'sans-serif' }}>
        <b>API Error:</b> {error}
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Article Blocks Demo</title>
      </Head>

      <div style={{ minHeight: '100vh', background: '#e8edf2', padding: '30px 20px' }}>

        {/* 8in × 3col - Locked baseline */}
        <div style={SECTION_STYLE}>
          <div style={LABEL_STYLE}>BLOCK-08A (LOCKED) · 8 inch · 3 column — /epaper/classic-article-demo</div>
          <ClassicArticleBlock {...articleProps} />
        </div>

        {/* 2in × 1col */}
        <div style={SECTION_STYLE}>
          <div style={LABEL_STYLE}>BLOCK-02A · 2 inch · 1 column — /epaper/block-2in-1col-demo</div>
          <ArticleBlock2in1col {...articleProps} />
        </div>

        {/* 3in × 1col */}
        <div style={SECTION_STYLE}>
          <div style={LABEL_STYLE}>BLOCK-03A · 3 inch · 1 column — /epaper/block-3in-1col-demo</div>
          <ArticleBlock3in1col {...articleProps} />
        </div>

        {/* 4in × 2col */}
        <div style={SECTION_STYLE}>
          <div style={LABEL_STYLE}>BLOCK-04A · 4 inch · 2 column — /epaper/block-4in-2col-demo</div>
          <ArticleBlock4in2col {...articleProps} />
        </div>

        {/* 6in × 2col */}
        <div style={SECTION_STYLE}>
          <div style={LABEL_STYLE}>BLOCK-06A · 6 inch · adaptive columns — /epaper/block-6in-2col-demo</div>
          <ArticleBlock6in2col {...articleProps} />
        </div>

        {/* 9in × 3col */}
        <div style={SECTION_STYLE}>
          <div style={LABEL_STYLE}>BLOCK-09A · 9 inch · 3 column — /epaper/block-9in-3col-demo</div>
          <ArticleBlock9in3col {...articleProps} />
        </div>

        {/* 12in × 4col */}
        <div style={SECTION_STYLE}>
          <div style={LABEL_STYLE}>BLOCK-12A · 12 inch · 4 column — /epaper/block-12in-4col-demo</div>
          <ArticleBlock12in4col {...articleProps} />
        </div>

      </div>
    </>
  )
}

export async function getServerSideProps({ req }) {
  try {
    const result = await fetchEpaperDemoArticle(req, ARTICLE_ID)
    if (!result.ok) {
      return { props: { articleProps: null, error: result.error } }
    }
    const data = result.data
    return { props: { articleProps: mapArticleToBlock(data), error: null } }
  } catch (err) {
    return { props: { articleProps: null, error: err.message || 'Unknown error' } }
  }
}
