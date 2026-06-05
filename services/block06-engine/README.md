# BLOCK-06A Newspaper Template Engine

**LOCKED** `threaded-v3.4` — see `../../lib/epaper/BLOCK_06A_LOCKED.md` (do not change layout without approval).

Pure **Node.js + Express + HTML/CSS** (no React). Local port **3096** (Next.js stays on 3000).

## Spec

| Rule | Value |
|------|--------|
| Width | 152.4mm (6in) |
| Max height | 254mm (10in), `overflow: hidden` |
| Words | 150–300 (reject outside) |
| Highlights | max 2 (column 1 top) |
| Image | max 1 (column 2 top) |
| Body | 11px / 14px, justify, 2 columns, 16px gap |

## Local URLs

| What | URL |
|------|-----|
| **Demo UI** | http://localhost:3096/static/demo.html |
| **Quick preview** | http://localhost:3096/layout/block06/preview |
| **API** | `POST http://localhost:3096/layout/block06/render` |
| **Health** | http://localhost:3096/health |

## Setup (local only — no SSH deploy)

```bash
cd services/block06-engine
cp .env.example .env
# Edit .env — DATABASE_URL (local Postgres) or set BLOCK06_SKIP_DB=true

npm install
```

### Option A — No database (fastest)

```bash
# .env
BLOCK06_SKIP_DB=true
PORT=3096

npm start
```

### Option B — Local PostgreSQL

```bash
# Docker example
docker run -d --name kaburlu-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16

# .env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/kaburlu_block06

createdb kaburlu_block06   # or via psql
npm run db:migrate
npm run db:seed
npm start
```

### Production database (optional)

Point `DATABASE_URL` in `.env` to production **only from your machine for testing** — do not commit `.env`. Prefer read-only user.

## API

```bash
curl -s -X POST http://localhost:3096/layout/block06/render \
  -H 'Content-Type: application/json' \
  -d '{
    "title":"శీర్షిక",
    "subtitle":"ఉపశీర్షిక",
    "highlights":["పాయింట్ 1","పాయింట్ 2"],
    "image":"https://example.com/photo.jpg",
    "content":"... 150-300 words ..."
  }' | jq '.valid, .wordCount, .estimatedHeightMm'
```

## From repo root

```bash
npm run block06:dev
npm run block06:test
```

## Folder structure

```
services/block06-engine/
├── db/migrations/001_block06_schema.sql
├── db/seed.sql
├── public/demo.html
├── scripts/migrate.js | seed.js | test-render.js
└── src/
    ├── constants.js
    ├── validateBlock06.js
    ├── calculateEstimatedHeight.js
    ├── splitArticleIntoTwoColumns.js
    ├── generateBlock06Html.js
    ├── generateBlock06Css.js
    ├── renderBlock06.js
    ├── server.js
    └── db/
```

## Files (core functions)

1. `validateBlock06()` — words + height rules  
2. `calculateEstimatedHeight()` — mm estimate before render  
3. `splitArticleIntoTwoColumns()` — col1 / col2 text split  
4. `generateBlock06Html()` — article markup  
5. `generateBlock06Css()` — stylesheet  
