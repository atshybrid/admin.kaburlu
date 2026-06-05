# Block classified engine (port 3100)

Demo UI for **CLASSIFIED-6C** / **CLASSIFIED-12C**. Rendering calls `kaburlu_media_backend` via `scripts/render_classified_cli.ts`.

## Database setup (run in media backend, not here)

Commands like `npx prisma migrate deploy` must run in **`kaburlu_media_backend`** (this folder has no Prisma schema). From anywhere:

```bash
cd /Volumes/Storage/kaburlu_softwares/kaburlu_media_backend
```

**Migrations** (pick one):

- Local dev DB: `npm run prisma:migrate:dev:env`
- Production: `npm run migrate:droplet` (do not use raw `npx prisma` on Mac if `.env` points at DO `:25060` — see `npm run prisma:migrate:deploy` hint)

**Seed classified block templates** (Mac `.env` → DO `:25060` often fails with P1001 — pick one):

```bash
# On droplet (needs .deploy.env with DEPLOY_HOST)
npm run seed:classified-blocks:droplet

# Or: SSH tunnel in another terminal: ./tunnel_db.sh then:
npm run seed:classified-blocks:tunnel

# Or: reachable URL in .env.development
npm run seed:classified-blocks:dev:env
```

From this service folder:

```bash
npm run seed:blocks:droplet
npm run seed:blocks:tunnel
```

## Run demo

```bash
npm run dev
# http://localhost:3100
```
