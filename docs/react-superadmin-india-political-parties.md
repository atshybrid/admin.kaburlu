# India Political Parties — React Super Admin

**Admin UI:** `/admin/political-parties` (this repo)

**API base:** `https://api.kaburlumedia.com/api/v1` (via `/api/proxy` in browser)

**Service:** `lib/api/services/politicalPartiesApi.js`

## Endpoints (Super Admin)

| Action | Method | Path |
|--------|--------|------|
| List + search | GET | `/political-parties/admin?q=&page=1&limit=25` |
| Detail | GET | `/political-parties/admin/{id}` |
| Create | POST | `/political-parties/admin` |
| Colors | PUT | `/political-parties/admin/{id}/colors` |
| Symbol text/URL | PUT | `/political-parties/admin/{id}/symbol` |
| Symbol file | POST | `/political-parties/admin/{id}/symbol/upload` (`file`) |
| Deactivate | DELETE | `/political-parties/admin/{id}` |

## Public (no login)

| GET | `/political-parties?q=bjp` |
| GET | `/political-parties/BJP` |

## Auth

```http
Authorization: Bearer <jwt>
```

Role: `SUPER_ADMIN`

## Example — update colors

```js
await politicalPartiesApi.updateColors(partyId, {
  primaryColor: '#FF9933',
  secondaryColor: '#138808',
  colorSource: 'MANUAL',
});
```

## Example — symbol upload

```js
const form = new FormData();
form.append('file', pngFile);
await politicalPartiesApi.uploadSymbol(partyId, form);
```

Swagger: **India Political Parties** tag at `/api/v1/docs`
