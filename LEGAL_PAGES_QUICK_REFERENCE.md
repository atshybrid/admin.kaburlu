# Legal Pages - Quick Reference

## Common Code Snippets

### 1. Create Privacy Policy
```javascript
import { pagesApi } from '@/lib/api/tenantApi'

await pagesApi.upsert('TENANT_ID', 'privacy-policy', {
  title: 'Privacy Policy',
  contentHtml: `
    <h1>Privacy Policy</h1>
    <p>Last updated: January 1, 2024</p>
    
    <h2>Information We Collect</h2>
    <p>We collect information you provide directly to us...</p>
    
    <h2>How We Use Your Information</h2>
    <p>We use the information we collect to...</p>
    
    <h2>Contact Us</h2>
    <p>For questions about this privacy policy, contact us at...</p>
  `,
  meta: { keywords: 'privacy, data protection, GDPR' },
  published: true
})
```

### 2. Create Terms of Service
```javascript
await pagesApi.upsert('TENANT_ID', 'terms-of-service', {
  title: 'Terms of Service',
  contentHtml: `
    <h1>Terms of Service</h1>
    
    <h2>1. Acceptance of Terms</h2>
    <p>By accessing our services, you agree to these terms...</p>
    
    <h2>2. User Responsibilities</h2>
    <p>You are responsible for...</p>
    
    <h2>3. Limitation of Liability</h2>
    <p>We are not liable for...</p>
  `,
  meta: { keywords: 'terms, service, legal' },
  published: true
})
```

### 3. Create Refund Policy
```javascript
await pagesApi.upsert('TENANT_ID', 'refund-policy', {
  title: 'Refund Policy',
  contentHtml: `
    <h1>Refund Policy</h1>
    
    <h2>Subscription Refunds</h2>
    <p>We offer refunds within 7 days of purchase if...</p>
    
    <h2>How to Request a Refund</h2>
    <ol>
      <li>Contact our support team</li>
      <li>Provide your order number</li>
      <li>State the reason for refund</li>
    </ol>
    
    <h2>Processing Time</h2>
    <p>Refunds are processed within 5-7 business days...</p>
  `,
  meta: { keywords: 'refund, cancellation, money back' },
  published: true
})
```

### 4. Create About Us
```javascript
await pagesApi.upsert('TENANT_ID', 'about-us', {
  title: 'About Us',
  contentHtml: `
    <h1>About Us</h1>
    
    <h2>Our Story</h2>
    <p>Founded in 2024, we are dedicated to...</p>
    
    <h2>Our Mission</h2>
    <p>To provide quality journalism and news coverage...</p>
    
    <h2>Our Team</h2>
    <p>We are a team of experienced journalists and editors...</p>
  `,
  meta: { keywords: 'about, company, mission' },
  published: true
})
```

### 5. Create Contact Page
```javascript
await pagesApi.upsert('TENANT_ID', 'contact', {
  title: 'Contact Us',
  contentHtml: `
    <h1>Contact Us</h1>
    
    <h2>Get in Touch</h2>
    <p>We'd love to hear from you!</p>
    
    <h3>Email</h3>
    <p>support@yourdomain.com</p>
    
    <h3>Phone</h3>
    <p>+91 123-456-7890</p>
    
    <h3>Address</h3>
    <p>123 News Street<br>
    City, State 123456<br>
    India</p>
  `,
  meta: { keywords: 'contact, support, help' },
  published: true
})
```

---

## Quick Status Updates

### Publish a Page
```javascript
await pagesApi.patch('TENANT_ID', 'privacy-policy', { published: true })
```

### Unpublish a Page
```javascript
await pagesApi.patch('TENANT_ID', 'terms-of-service', { published: false })
```

### Update Only Content
```javascript
await pagesApi.patch('TENANT_ID', 'refund-policy', {
  contentHtml: '<h1>Updated Refund Policy</h1><p>New content...</p>'
})
```

### Update Only Title
```javascript
await pagesApi.patch('TENANT_ID', 'about-us', {
  title: 'About Our Company'
})
```

---

## Fetch & Display (Frontend)

### React Component Example
```jsx
'use client'
import { useEffect, useState } from 'react'

export default function PrivacyPolicyPage() {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/v1/public/privacy-policy', {
      headers: {
        'X-Tenant-Domain': window.location.hostname
      }
    })
      .then(res => res.json())
      .then(data => {
        setPage(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])
  
  if (loading) return <div>Loading...</div>
  if (!page) return <div>Page not found</div>
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">{page.title}</h1>
      <div 
        className="prose prose-lg"
        dangerouslySetInnerHTML={{ __html: page.contentHtml }} 
      />
    </div>
  )
}
```

### Next.js Server Component Example
```jsx
async function getPage(slug) {
  const res = await fetch(
    `https://api.kaburlumedia.com/api/v1/public/${slug}`,
    {
      headers: {
        'X-Tenant-Domain': process.env.DOMAIN || 'example.com'
      },
      cache: 'no-store'
    }
  )
  return res.json()
}

export default async function LegalPage({ params }) {
  const page = await getPage(params.slug)
  
  return (
    <article className="max-w-4xl mx-auto py-8 px-4">
      <h1>{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
    </article>
  )
}
```

---

## Batch Operations

### Create All Legal Pages at Once
```javascript
const legalPages = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    contentHtml: '<h1>Privacy Policy</h1><p>Content...</p>',
    meta: { keywords: 'privacy' }
  },
  {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    contentHtml: '<h1>Terms</h1><p>Content...</p>',
    meta: { keywords: 'terms' }
  },
  {
    slug: 'refund-policy',
    title: 'Refund Policy',
    contentHtml: '<h1>Refunds</h1><p>Content...</p>',
    meta: { keywords: 'refund' }
  }
]

async function createAllPages(tenantId) {
  for (const page of legalPages) {
    await pagesApi.upsert(tenantId, page.slug, {
      title: page.title,
      contentHtml: page.contentHtml,
      meta: page.meta,
      published: true
    })
  }
}

await createAllPages('TENANT_ID')
```

---

## URL Patterns

### Admin Panel URLs
- List: `/admin/tenants/[TENANT_ID]/pages`
- Edit: Click on page in the list

### Public URLs (Frontend)
- Privacy: `/privacy-policy` or custom route
- Terms: `/terms-of-service`
- Refund: `/refund-policy`
- About: `/about-us`
- Contact: `/contact`

### API Endpoints
- Admin: `https://api.kaburlumedia.com/api/v1/tenants/[TENANT_ID]/pages/[SLUG]`
- Public: `https://api.kaburlumedia.com/api/v1/public/[SLUG]`

---

## Validation Rules

### Slug
- Must be kebab-case
- Allowed: `privacy-policy`, `terms-of-service`
- Not allowed: `privacyPolicy`, `privacy_policy`

### Content
- Minimum: 50 characters (for "draft" status check)
- Format: HTML string
- Required: Yes

### Title
- Required: Yes
- Max length: 200 characters (recommended)

### Published
- Type: Boolean
- Default: true
- Required: No

---

## Error Handling

```javascript
try {
  await pagesApi.upsert(tenantId, 'privacy-policy', payload)
  console.log('✅ Page created successfully')
} catch (error) {
  if (error.message.includes('401')) {
    console.error('❌ Unauthorized - Check your token')
  } else if (error.message.includes('404')) {
    console.error('❌ Tenant not found')
  } else {
    console.error('❌ Error:', error.message)
  }
}
```

---

## Testing with cURL

### Create Page
```bash
curl -X PUT \
  https://api.kaburlumedia.com/api/v1/tenants/TENANT_ID/pages/privacy-policy \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Privacy Policy","contentHtml":"<h1>Privacy</h1>","published":true}'
```

### Get Page
```bash
curl -X GET \
  https://api.kaburlumedia.com/api/v1/tenants/TENANT_ID/pages/privacy-policy \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Status
```bash
curl -X PATCH \
  https://api.kaburlumedia.com/api/v1/tenants/TENANT_ID/pages/privacy-policy \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"published":false}'
```

### Delete Page
```bash
curl -X DELETE \
  https://api.kaburlumedia.com/api/v1/tenants/TENANT_ID/pages/privacy-policy \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Public Access (No Auth)
```bash
curl -X GET \
  https://api.kaburlumedia.com/api/v1/public/privacy-policy \
  -H "X-Tenant-Domain: yourdomain.com"
```
