# BLOCK-08A Newspaper Template Engine

**8 inch · 3 columns** — same threaded style as BLOCK-06A.

| Column | Top | Then |
|--------|-----|------|
| 1 | Highlights (max 2) | Article text |
| 2 | Image 1 (192px) | Article continues |
| 3 | Image 2 (128px, optional) | Article continues |

Port **3097** (BLOCK-06A uses 3096).

## URLs

| What | URL |
|------|-----|
| Demo | http://localhost:3097/static/demo.html |
| Preview | http://localhost:3097/layout/block08/preview |
| API | `POST http://localhost:3097/layout/block08/render` |

## Setup

```bash
cd services/block08-engine
cp .env.example .env   # optional: BLOCK08_SKIP_DB=true
npm install
npm run dev
```

## API body

```json
{
  "title": "…",
  "subtitle": "…",
  "highlights": ["…", "…"],
  "image": ["url-col2", "url-col3"],
  "content": "… 180–380 words …"
}
```

`image` can be a single URL (col2 only) or array of up to 2 URLs.

## Spec

- Width: **203.2mm (8in)**
- Words: **180–380**
- Engine: `threaded-v1.0`
- Typography / H&J rules: same as BLOCK-06A (Mandali 11px, no Telugu hyphens)

See `../../lib/epaper/BLOCK_08A_ENGINE_LOCKED.md`.
