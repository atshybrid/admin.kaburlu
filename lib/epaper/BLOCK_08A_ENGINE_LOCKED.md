# BLOCK-08A engine — 8in · 3 columns (locked)

**Engine:** `services/block08-engine/` · `threaded-v1.0`  
**Port:** 3097

## Layout (user spec)

```
┌──────────── 8 inch rail ────────────┐
│           Title / Subtitle          │
├─────────┬─────────┬─────────────────┤
│ Col 1   │ Col 2   │ Col 3           │
│ Points  │ Image 1 │ Image 2 (opt.)  │
│ Text…   │ Text…   │ Text…           │
└─────────┴─────────┴─────────────────┘
```

- **06A-style rules:** threaded text, even column bottoms, Telugu body typography, no debug meta in preview.
- **Images:** 1st → column 2 top; 2nd → column 3 top.

## Files

| Path |
|------|
| `services/block08-engine/src/*` |
| `services/block08-engine/public/threadBalance.js` |
| `lib/epaper/block08EngineLockedRules.js` |

## Note on React UI

`Block08Article.jsx` in admin may still reference 7.5in from `wideBlockRules.js`. Production HTML/CSS from this engine uses **8in**. Align React when moving preview to admin.
