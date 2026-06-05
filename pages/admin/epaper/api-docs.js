import Head from 'next/head'
import Script from 'next/script'
import Link from 'next/link'

const SPEC_URL = '/openapi/epaper-smart-design.openapi.json'

export default function EpaperApiDocsPage() {
  return (
    <>
      <Head>
        <title>ePaper Smart Design API — Swagger</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#fafafa' }}>
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <Link href="/admin/epaper" style={{ fontSize: 13, color: '#6366f1', textDecoration: 'none' }}>
            ← ePaper
          </Link>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
            ePaper Smart Design API (Swagger)
          </h1>
          <a href={SPEC_URL} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
            openapi.json
          </a>
        </div>
        <div id="swagger-ui" />
      </div>
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && window.SwaggerUIBundle) {
            window.SwaggerUIBundle({
              dom_id: '#swagger-ui',
              url: SPEC_URL,
              deepLinking: true,
              presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIBundle.SwaggerUIStandalonePreset],
              layout: 'StandaloneLayout',
            })
          }
        }}
      />
    </>
  )
}
