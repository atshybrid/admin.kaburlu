# BLOCK-06A — locked (do not change without explicit approval)

**Version:** `BLOCK_06A_ENGINE_VERSION` = `threaded-v3.4`  
**Rules:** `BLOCK_06A_RULES_VERSION` in `lib/epaper/block06LockedRules.js`  
**Locked:** 2026-06-01

## Scope

- **6in** rail · **2 columns** · Quark-style threaded body
- **Col1:** highlights → article (text starts immediately below points)
- **Col2:** image (192px) → article continues
- **Bottoms:** pixel obstacle split + browser `threadBalance.js` (±5px)
- **Telugu body:** no hyphens, strict line-break; col1 last line left-aligned
- **Preview:** no debug meta line (use `?debug=1` on engine preview only)

## Files (frozen)

| Area | Path |
|------|------|
| Engine (API) | `services/block06-engine/src/*` |
| DOM balance | `services/block06-engine/public/threadBalance.js` |
| React UI | `components/epaper/Block06Article.jsx`, `Block06Article.module.css` |
| Flow | `lib/epaper/block06CrossColumnFlow.js`, `block06ThreadFlow.js`, `block06ColumnModel.js` |
| Rules | `lib/epaper/block06LockedRules.js`, `BLOCK_06A_*` in `wideBlockRules.js` |
| DB seed | `services/block06-engine/db/seed.sql` |

## Engine endpoints

| URL | Purpose |
|-----|---------|
| `POST /layout/block06/render` | HTML + CSS JSON |
| `GET /layout/block06/preview` | Browser preview |
| `GET /static/demo.html` | Local demo |

## Do not

- Reintroduce shared-top padding between points and col1 body
- Use `text-align-last: justify` on col1 body (orphan stretch)
- Use `hyphens: auto` on Telugu body
- Show engine stats in production preview (meta footer)

## Related

- **BLOCK-08A** — locked separately (`BLOCK_08A_LOCKED.md`); 3-column variant
- **BLOCK-04A** — `block04LockedRules.js`
