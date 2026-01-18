# ePaper Social Media Sharing - Quick Fix

## Problem
When sharing ePaper URLs on WhatsApp/Facebook, the cover image doesn't show.

## Solution
Add these meta tags to your ePaper viewer page using the existing `coverImageUrl` from your issue data.

---

## Step 1: Add Meta Tags to ePaper Viewer Page

In your ePaper viewer page (e.g., `/pages/epaper/[edition]/[date]/[page].js` or similar):

```jsx
import Head from 'next/head'

export default function EPaperPage({ issue, editionName, pageNumber, currentUrl }) {
  // Use the existing coverImageUrl from your issue data
  const shareImage = issue?.coverImageUrl || issue?.pages?.[0]?.imageUrl
  const shareTitle = `${editionName} - ${issue?.issueDate}`
  const shareDescription = `Read ${editionName} ePaper for ${issue?.issueDate}`
  
  return (
    <>
      <Head>
        {/* Page Title */}
        <title>{shareTitle}</title>
        
        {/* WhatsApp, Facebook, LinkedIn - OpenGraph Tags */}
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Prashnaayudham ePaper" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareDescription} />
        <meta name="twitter:image" content={shareImage} />
      </Head>

      {/* Your existing ePaper viewer code */}
      <div>
        {/* ePaper content */}
      </div>
    </>
  )
}

// Fetch issue data with coverImageUrl
export async function getServerSideProps(context) {
  const { edition, date, page } = context.params
  
  // Your existing API call that returns issue with coverImageUrl
  const response = await fetch(`${process.env.API_BASE_URL}/api/epaper/issues?edition=${edition}&date=${date}`)
  const issue = await response.json()
  
  const currentUrl = `https://epaper.prashnaayudham.com/epaper/${edition}/${date}/${page}`
  
  return {
    props: {
      issue: issue.issue || issue,
      editionName: edition.replace(/-/g, ' '),
      pageNumber: parseInt(page),
      currentUrl
    }
  }
}
```

---

## Step 2: Ensure Image URL is Absolute

Make sure `coverImageUrl` in your API response is a **full HTTPS URL**, not a relative path:

✅ **Correct:** `https://cdn.prashnaayudham.com/epaper/covers/2026-01-18.jpg`  
❌ **Wrong:** `/images/covers/2026-01-18.jpg`

---

## Step 3: Test the Sharing

After deploying, test with:

1. **WhatsApp Web**: Share the link in a chat
2. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
3. **Twitter Validator**: https://cards-dev.twitter.com/validator

**Important:** First time you share, use Facebook Debugger to "Scrape Again" to clear cache.

---

## Quick Copy-Paste Solution

Just add this to your ePaper viewer's `<Head>`:

```jsx
<Head>
  <meta property="og:image" content={issue.coverImageUrl} />
  <meta property="og:title" content={`${editionName} - ${issue.issueDate}`} />
  <meta property="og:description" content={`Read today's ePaper`} />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
</Head>
```

That's it! The cover image will now appear when sharing.
