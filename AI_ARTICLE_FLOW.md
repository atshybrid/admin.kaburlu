# AI Article Creation Flow - Complete Guide

## 🎯 Overview

The article creation uses a **2-step AI-powered workflow**:

1. **Step 1**: User pastes raw text → AI processes and structures it
2. **Step 2**: User reviews AI output → Edits and publishes

---

## 📊 Data Flow Diagram

```
User Input (Raw Text)
    ↓
AI API Request (with tenant metadata)
    ↓
AI Response (structured article)
    ↓
Form Pre-fill (title, content, summary, tags)
    ↓
User Review & Edit
    ↓
Final Article Payload
    ↓
POST /articles/unified
    ↓
Article Created ✅
```

---

## 🤖 Step 1: AI Processing

### Input Data Collection

```javascript
// 1. Get tenant data
const tenantData = await tenantsApi.get(selectedTenant)
// Returns: { id, name, entity: { nativeName, language: { code, name } } }

// 2. Get categories for the tenant
const categories = await articleService.getCategories(tenantId)
// Returns: [{ id, name, translatedName }]

// 3. User raw text input
const rawText = "అమృత్ నగర్ తండావాసులకు డబుల్ బెడ్ రూమ్ ఇల్లు కేటాయింపు..."
```

### AI API Request

**Endpoint**: `POST https://app.kaburlumedia.com/api/v1/ai/rewrite/unified`

**Payload Structure**:
```javascript
{
  rawText: "అమృత్ నగర్ తండావాసులకు డబుల్ బెడ్ రూమ్...",
  
  categories: ["Politics", "Government", "Local News"],
  // ↑ Extracted from tenant's categories: categories.map(c => c.name || c.translatedName)
  
  newspaperName: "ప్రజావాణి",
  // ↑ From tenant.entity.nativeName
  
  language: {
    code: "te",           // From tenant.entity.language.code
    name: "Telugu",       // From tenant.entity.language.name
    script: null,         // Fixed: always null
    region: null          // Fixed: always null
  },
  
  temperature: 0.2,       // Fixed: always 0.2
  model: "5.2"            // Fixed: always "5.2"
}
```

### AI API Implementation

```javascript
const handleProcessAI = async () => {
  // 1. Prepare category names array
  const categoryNames = categories.map(cat => 
    cat.name || cat.translatedName
  ).filter(Boolean)
  
  // 2. Extract language from tenant entity
  const languageData = tenantData.entity.language || {}
  
  // 3. Build AI payload
  const aiPayload = {
    rawText: rawText.trim(),
    categories: categoryNames,
    newspaperName: tenantData.entity.nativeName || '',
    language: {
      code: languageData.code || 'te',
      name: languageData.name || 'Telugu',
      script: null,
      region: null
    },
    temperature: 0.2,
    model: '5.2'
  }
  
  // 4. Call AI service
  const response = await aiArticleService.rewrite(
    aiPayload.rawText,
    selectedTenant,
    aiPayload.language.code
  )
  
  // 5. Store response
  setAiResponse(response)
}
```

### AI Response Format

Expected response from AI API:

```javascript
{
  title: "అమృత్ నగర్ తండావాసులకు డబుల్ బెడ్ రూమ్ ఇళ్ళు కేటాయింపు",
  headline: "అమృత్ నగర్ తండావాసులకు డబుల్ బెడ్ రూమ్ ఇళ్ళు కేటాయింపు",
  content: "కూకట్‌పల్లి ప్రతినిధి, ఫతేనగర్ డివిజన్ అమృత్ నగర్ తండావాసుల 40 ఏళ్ల స్వప్నం సాకారం కాబోతుంది...",
  body: "Full article content...",
  summary: "Brief summary of the article",
  excerpt: "Short excerpt...",
  category: "Politics",
  tags: ["Politics", "Housing", "Telangana"] // or "Politics, Housing, Telangana"
}
```

---

## 📝 Step 2: Review & Publish

### Form Pre-filling

After AI response, form is automatically filled:

```javascript
setForm({
  title: response.title || response.headline || '',
  content: response.content || response.body || '',
  summary: response.summary || response.excerpt || '',
  tags: Array.isArray(response.tags) 
    ? response.tags.join(', ') 
    : (response.tags || ''),
  categoryId: matchedCategory?.id || '', // Auto-matched if possible
  languageCode: tenantData.entity.language.code || 'te',
  status: 'DRAFT',
  imageUrl: ''
})
```

### Category Auto-matching

```javascript
if (response.category) {
  const matchedCat = categories.find(cat => 
    cat.name?.toLowerCase() === response.category?.toLowerCase() ||
    cat.translatedName?.toLowerCase() === response.category?.toLowerCase()
  )
  if (matchedCat) {
    setForm(prev => ({ ...prev, categoryId: matchedCat.id }))
  }
}
```

---

## 🚀 Step 3: Final Submission

### Article Payload Construction

**Endpoint**: `POST /articles/unified` (via `articleService.create()`)

**Final Payload**:
```javascript
{
  // Required fields
  tenantId: "67890c3b74a0c48b92e76e84",
  title: "అమృత్ నగర్ తండావాసులకు డబుల్ బెడ్ రూమ్ ఇళ్ళు కేటాయింపు",
  content: "కూకట్‌పల్లి ప్రతినిధి, ఫతేనగర్ డివిజన్...",
  categoryId: "cat_12345",
  languageCode: "te",
  status: "DRAFT" | "PUBLISHED",
  
  // Optional fields
  summary: "Brief summary...",
  tags: "Politics, Housing, Telangana",
  imageUrl: "https://cdn.example.com/image.jpg",
  
  // AI Metadata (if AI was used)
  aiGenerated: true,
  aiModel: "5.2",
  rawText: "Original raw text input for reference"
}
```

### Implementation

```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  
  const articlePayload = {
    tenantId: selectedTenant,
    title: form.title.trim(),
    content: form.content.trim(),
    summary: form.summary?.trim() || '',
    categoryId: form.categoryId,
    languageCode: form.languageCode || 'te',
    tags: form.tags || '',
    imageUrl: form.imageUrl || '',
    status: form.status || 'DRAFT',
    
    // AI metadata
    ...(aiResponse && {
      aiGenerated: true,
      aiModel: '5.2',
      rawText: rawText
    })
  }
  
  const result = await articleService.create(articlePayload)
  // Returns: { id, title, status, createdAt, ... }
}
```

---

## 🔑 Key Mapping Reference

### Tenant Data Mapping

| Source | Destination | Example |
|--------|-------------|---------|
| `tenant.entity.nativeName` | AI `newspaperName` | "ప్రజావాణి" |
| `tenant.entity.language.code` | AI `language.code` | "te" |
| `tenant.entity.language.name` | AI `language.name` | "Telugu" |
| `tenant.id` | Final `tenantId` | "67890c3b..." |

### Category Mapping

| Source | Destination | Example |
|--------|-------------|---------|
| `categories[].name` | AI `categories[]` | "Politics" |
| `categories[].translatedName` | AI `categories[]` | "రాజకీయాలు" |
| `categories[].id` | Final `categoryId` | "cat_12345" |

### AI Response → Form Mapping

| AI Response Field | Form Field | Fallback |
|------------------|------------|----------|
| `response.title` or `headline` | `form.title` | "" |
| `response.content` or `body` | `form.content` | "" |
| `response.summary` or `excerpt` | `form.summary` | "" |
| `response.tags` (array or string) | `form.tags` | "" |
| `response.category` (matched) | `form.categoryId` | first category |

---

## 🎨 UI/UX Features

### Progress Indicator
- **Step 1**: Blue gradient badge - "Raw Input"
- **Step 2**: Blue gradient badge - "Review & Publish"

### Real-time Feedback
- Character counter for raw text input
- Word counter for raw text
- "Ready for AI" indicator when text > 100 chars
- Processing spinner during AI call
- Success/error messages with icons

### Validation
- Tenant required for all users
- Raw text required (min length recommended)
- Title and content required before submission
- Category selection required

### Role-based Logic
- **Super Admin**: Shows tenant selector dropdown
- **Tenant Admin/Reporter**: Auto-uses their assigned tenant

---

## 🔧 Error Handling

```javascript
// Validation errors
if (!rawText.trim()) {
  setError('Please enter article text')
  return
}

if (!selectedTenant) {
  setError('Please select a tenant')
  return
}

// API errors
try {
  const response = await aiArticleService.rewrite(...)
} catch (err) {
  console.error('❌ AI Error:', err)
  setError(err.message || 'AI processing failed')
}
```

---

## 📊 Complete Flow Example

### 1. User Inputs Raw Text
```
Input: "అమృత్ నగర్ తండావాసులకు డబుల్ బెడ్ రూమ్ ఇల్లు కేటాయింపు ప్రశ్న ఆయుధం..."
```

### 2. AI Request Sent
```json
{
  "rawText": "అమృత్ నగర్ తండావాసులకు డబుల్...",
  "categories": ["Politics", "Local News", "Government"],
  "newspaperName": "ప్రజావాణి",
  "language": {
    "code": "te",
    "name": "Telugu",
    "script": null,
    "region": null
  },
  "temperature": 0.2,
  "model": "5.2"
}
```

### 3. AI Response Received
```json
{
  "title": "అమృత్ నగర్ తండావాసులకు డబుల్ బెడ్ రూమ్ ఇళ్ళు కేటాయింపు",
  "content": "కూకట్‌పల్లి ప్రతినిధి, ఫతేనగర్ డివిజన్ అమృత్ నగర్ తండావాసుల 40 ఏళ్ల స్వప్నం సాకారం కాబోతుంది. హైదరాబాద్‌లోని ఫతేనగర్ డివిజన్ కూకట్‌పల్లి నియోజకవర్గ ప్రాంతంలోని అమృత్ నగర్‌లో తండావాసులకు డబుల్ బెడ్ రూమ్ ఇళ్లు కేటాయించేందుకు ప్రభుత్వం నిర్ణయించింది...",
  "summary": "కూకట్‌పల్లి నియోజకవర్గంలోని అమృత్ నగర్ తండావాసులకు డబుల్ బెడ్ రూమ్ ఇళ్ళు కేటాయించేందుకు ప్రభుత్వం నిర్ణయం",
  "category": "Politics",
  "tags": ["Politics", "Housing", "Hyderabad", "Telangana"]
}
```

### 4. Form Pre-filled
```javascript
{
  title: "అమృత్ నగర్ తండావాసులకు డబుల్ బెడ్ రూమ్ ఇళ్ళు కేటాయింపు",
  content: "కూకట్‌పల్లి ప్రతినిధి, ఫతేనగర్ డివిజన్...",
  summary: "కూకట్‌పల్లి నియోజకవర్గంలోని అమృత్ నగర్...",
  tags: "Politics, Housing, Hyderabad, Telangana",
  categoryId: "cat_politics_id", // Auto-matched
  languageCode: "te",
  status: "DRAFT"
}
```

### 5. Final Article Payload
```json
{
  "tenantId": "67890c3b74a0c48b92e76e84",
  "title": "అమృత్ నగర్ తండావాసులకు డబుల్ బెడ్ రూమ్ ఇళ్ళు కేటాయింపు",
  "content": "కూకట్‌పల్లి ప్రతినిధి, ఫతేనగర్ డివిజన్ అమృత్ నగర్...",
  "summary": "కూకట్‌పల్లి నియోజకవర్గంలోని అమృత్ నగర్...",
  "categoryId": "cat_politics_id",
  "languageCode": "te",
  "tags": "Politics, Housing, Hyderabad, Telangana",
  "imageUrl": "",
  "status": "DRAFT",
  "aiGenerated": true,
  "aiModel": "5.2",
  "rawText": "అమృత్ నగర్ తండావాసులకు డబుల్..."
}
```

### 6. Article Created
```json
{
  "id": "article_12345",
  "tenantId": "67890c3b74a0c48b92e76e84",
  "title": "అమృత్ నగర్ తండావాసులకు డబుల్ బెడ్ రూమ్ ఇళ్ళు కేటాయింపు",
  "status": "DRAFT",
  "createdAt": "2026-01-23T10:30:00Z",
  "createdBy": "user_reporter_id"
}
```

---

## 🛠️ Usage in Pages

### Using PostArticle Component

```javascript
// pages/admin/articles/create.js
import PostArticle from '../../../components/dashboard/PostArticle'

export default function CreateArticlePage() {
  const router = useRouter()
  
  return (
    <Layout>
      <PostArticle
        onSuccess={(article) => {
          router.push(`/admin/articles?id=${article.id}`)
        }}
        onCancel={() => {
          router.push('/admin/articles')
        }}
      />
    </Layout>
  )
}
```

---

## 🎯 Key Advantages

✅ **2-step flow** reduces complexity
✅ **AI auto-structures** raw text into proper article format
✅ **Category auto-matching** from AI suggestions
✅ **Tenant metadata** automatically included in AI request
✅ **Editable fields** - users can modify AI output
✅ **Clear progress indicators** for better UX
✅ **Error handling** at each step
✅ **Role-based** tenant selection

---

## 📚 Related Files

- [components/dashboard/PostArticle.jsx](components/dashboard/PostArticle.jsx) - Main component
- [lib/api/services/aiArticleService.js](lib/api/services/aiArticleService.js) - AI API calls
- [lib/api/services/articleService.js](lib/api/services/articleService.js) - Article CRUD
- [lib/api/tenantApi.js](lib/api/tenantApi.js) - Tenant data fetching
- [ARTICLE_MANAGEMENT_DOCS.md](ARTICLE_MANAGEMENT_DOCS.md) - Article system docs
