# BLOCK-12A Layout Engine

12-inch fixed-width newspaper block · **4 columns** · max height **21 inches**. Inspired by [BLOCK-08A](../block08-engine/) (3 columns).

## Layout

| Column | Top | Body |
|--------|-----|------|
| 1 | Highlights (up to 4) | Threaded text |
| 2 | Image 1 | Text |
| 3 | Image 2 | Text |
| 4 | Image 3 | Text |

**Bottom gallery** (full width, 4-column grid): images 4–16 — remaining photos flow left→right across columns 1–4.

## Limits

- Width: **12in** (304.8mm) fixed  
- Max height: **21in** (533.4mm)  
- Words: **300–750**  
- Images: **max 16** (3 column tops + up to 13 bottom)  
- Highlights: **max 4**

## URLs (default port **3098**)

| Page | URL |
|------|-----|
| **Demo UI** | http://localhost:3098/static/demo.html |
| **Preview** | http://localhost:3098/layout/block12/preview |
| **Health** | http://localhost:3098/health |
| **Render API** | `POST http://localhost:3098/layout/block12/render` |

Preview with debug meta: `?debug=1`

## Quick start

```bash
cd admin.kaburlu/services/block12-engine
cp .env.example .env
npm install
npm run dev
```

## Sample API body

```json
{
  "title": "బ్లాక్-12A: నాలుగు నిలువు వరుసలు",
  "subtitle": "12 అంగుళాల వెడల్పు",
  "highlights": ["అంశం 1", "అంశం 2", "అంశం 3", "అంశం 4"],
  "image": [
    "https://…/img1.jpg",
    "https://…/img2.jpg",
    "https://…/img3.jpg",
    "https://…/img4.jpg",
    "https://…/img5.jpg"
  ],
  "content": "…300+ words…"
}
```

First 3 `image` URLs → columns 2–4 tops. URLs 4+ → bottom gallery.

## Engine

- Version: `threaded-v1.0`
- Code: `BLOCK-12A`
