# Social Media Sharing Meta Tags Guide

## Issue
When sharing ePaper URLs (e.g., `https://epaper.prashnaayudham.com/epaper/main-edition/2026-01-18/1`) on WhatsApp and other social media platforms, the cover image and caption are not being displayed.

## Solution
Add Open Graph (OG) and Twitter Card meta tags to the ePaper viewer page.

---

## For the ePaper Viewer Application

### 1. Dynamic Meta Tags in Page Component

Add this to your ePaper viewer page (e.g., `pages/epaper/[edition]/[date]/[page].js`):

```jsx
import Head from 'next/head'

export default function EPaperViewerPage({ issue, edition, pageNumber }) {
  // Construct meta data
  const title = `${edition.name} - ${issue.issueDate} - Page ${pageNumber}`
  const description = `Read ${edition.name} ePaper edition for ${issue.issueDate}. Page ${pageNumber} of ${issue.pageCount}.`
  const coverImage = issue.coverImageUrl || issue.pages?.[0]?.imageUrl
  const pageUrl = `https://epaper.prashnaayudham.com/epaper/${edition.slug}/${issue.issueDate}/${pageNumber}`

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{title}</title>
        <meta name="description" content={description} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={coverImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${edition.name} - ${issue.issueDate}`} />
        <meta property="og:site_name" content="Prashnaayudham ePaper" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={coverImage} />
        <meta name="twitter:image:alt" content={`${edition.name} - ${issue.issueDate}`} />
        
        {/* WhatsApp Specific (uses OG tags) */}
        <meta property="og:locale" content="en_US" />
        
        {/* Article specific */}
        <meta property="article:published_time" content={issue.issueDate} />
        <meta property="article:section" content="Newspaper" />
      </Head>

      {/* Your page content */}
      <div>
        {/* ePaper viewer UI */}
      </div>
    </>
  )
}

// Server-side props to fetch issue data
export async function getServerSideProps(context) {
  const { edition, date, page } = context.params
  
  // Fetch issue data from your API
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/epaper/issues?edition=${edition}&date=${date}`)
  const issue = await res.json()
  
  return {
    props: {
      issue,
      edition: { name: 'Main Edition', slug: edition },
      pageNumber: parseInt(page)
    }
  }
}
```

---

### 2. Add to _document.js (Optional - Default Fallback)

Create or update `pages/_document.js`:

```jsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Default Open Graph tags (fallback) */}
        <meta property="og:site_name" content="Prashnaayudham ePaper" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

---

### 3. Image Requirements

**For WhatsApp:**
- Image size: Minimum 300x200px, Recommended 1200x630px
- Aspect ratio: 1.91:1
- Format: JPG or PNG
- File size: Less than 5MB
- Must be publicly accessible (HTTPS)

**For Facebook/Instagram:**
- Recommended: 1200x630px
- Aspect ratio: 1.91:1

**For Twitter:**
- Large card: 1200x600px minimum
- Aspect ratio: 2:1

---

### 4. Testing Tools

Test your meta tags using:

1. **Facebook Debugger:** https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator:** https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector:** https://www.linkedin.com/post-inspector/
4. **WhatsApp:** Share the link in a chat and see the preview

**Important:** After adding meta tags, use these tools to refresh the cache.

---

### 5. Debugging Checklist

If sharing still doesn't work:

- [ ] Verify image URL is publicly accessible (test in incognito)
- [ ] Check image is served over HTTPS
- [ ] Ensure image meets size requirements (1200x630px recommended)
- [ ] Verify meta tags are in the HTML source (view page source)
- [ ] Clear social media cache using debugging tools
- [ ] Check robots.txt isn't blocking crawlers
- [ ] Ensure page returns 200 status code

---

### 6. Example API Response Structure

Your API should return data like:

```json
{
  "issue": {
    "id": "123",
    "issueDate": "2026-01-18",
    "pageCount": 16,
    "coverImageUrl": "https://cdn.prashnaayudham.com/epaper/2026-01-18/cover.jpg",
    "pdfUrl": "https://cdn.prashnaayudham.com/epaper/2026-01-18/full.pdf",
    "pages": [
      {
        "pageNumber": 1,
        "imageUrl": "https://cdn.prashnaayudham.com/epaper/2026-01-18/page-1.jpg"
      }
    ]
  },
  "edition": {
    "id": "main-edition",
    "name": "Main Edition",
    "slug": "main-edition"
  }
}
```

---

## Quick Fix for Existing ePaper Viewer

If you already have an ePaper viewer page, just add this to the component:

```jsx
<Head>
  <meta property="og:image" content={issue.coverImageUrl} />
  <meta property="og:title" content={`${editionName} - ${date}`} />
  <meta property="og:description" content={`Read today's edition`} />
  <meta property="og:url" content={window.location.href} />
  <meta name="twitter:card" content="summary_large_image" />
</Head>
```

Make sure the `issue.coverImageUrl` is a full HTTPS URL, not a relative path.
