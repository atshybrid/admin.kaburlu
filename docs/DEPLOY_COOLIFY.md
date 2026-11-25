# Admin — Coolify (planned)

Droplet SSH deploy is **disabled**. Use local dev only until Coolify is set up.

```bash
npm run dev          # http://localhost:3000
npm run preflight:deploy   # still valid for local build check
```

Backend must run locally: `NEXT_PUBLIC_BACKEND_URL=http://localhost:3011/api/v1` in `.env.local`.

`npm run deploy:droplet` and `rollback:droplet` are blocked — see parent `kaburlu_media_backend/docs/DEPLOY_COOLIFY.md`.