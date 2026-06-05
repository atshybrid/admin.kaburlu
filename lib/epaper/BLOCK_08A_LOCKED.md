# BLOCK-08A — locked (do not change without explicit approval)

**Version:** `BLOCK_08A_RULES_VERSION` in `lib/epaper/wideBlockRules.js`  
**Locked:** 2026-05-20

## Scope

- 7.5in rail · **3 columns** · threaded body (col1 → col2 below image → col3)
- H&J body, `EditorialCropImage`, obstacle-based even bottoms
- Title band: `BLOCK_08A_TITLE` (35–58px, multi-line on rail)

## Files (frozen)

| Area | Path |
|------|------|
| UI | `components/epaper/Block08Article.jsx`, `Block08Article.module.css`, `Block08ColumnBody.jsx`, `EditorialCropImage.jsx` |
| Flow | `lib/epaper/block08CrossColumnFlow.js`, `block08ThreadFlow.js`, `block08ColumnModel.js`, `block08EditorialIntel.js` |
| Typography / measure | `lib/epaper/block08Measure.js`, `block08LineComposer.js`, `block08BodyTypography.js` |
| Images | `lib/epaper/block08ImageFrame.js`, `editorialImageCrop.js` |
| Rules | `BLOCK_08A_*` in `wideBlockRules.js` |

## Related

**BLOCK-06A** is locked separately — see `BLOCK_06A_LOCKED.md` and `block06LockedRules.js` (2-column threaded engine). Do not refactor 08A when changing 06A unless fixing a critical 08A-only bug.

## Restore snapshot

See `.backup/block08a-20260525/README.md` for image/title hotfix restore commands.
