# Kaburlu Admin UI/UX Audit

**Date:** 2026-11-21  
**Method:** Code review + HTTP checks + recent News Desk redesign session (not every route manually clicked in browser automation).

## Design system baseline (target)

- **Reference:** Linear / Stripe density (compact headers, `rounded-xl` cards, 11px table headers).
- **Stack:** Tailwind + `components/ui/*` (no shadcn migration).
- **Brand:** `text-brand`, slate neutrals, `StatusBadge`.

---

## Global layout & navigation

| Route area | Problem | Root cause | Severity | Recommended fix | Verified |
|------------|---------|------------|----------|-----------------|----------|
| All `/admin/*` | Platform desk users see reduced nav | `platformDesk.js` + `DashboardLayout` redirect | P2 (intentional) | Document in onboarding | — |
| Sidebar | Duplicate “Daily Newspaper News” in `main` + `platform` | `dashboardNavConfig.js` | P3 | Dedupe keys for desk shell | — |
| `/admin/news-desk` | White screen | Corrupt `.next` → 500 `vendor-chunks/next.js` | **P0** | `npm run dev:clean` | **Fixed** (restart) |
| Headers | Mixed:bold `font-bold` vs semibold across modules | Historical pages | P3 | Adopt `NewsDeskPageHeader` pattern module-by-module | Partial (News Desk) |

---

## News Desk (detailed — recently updated)

| Page | Problem | Root cause | Severity | Fix | Verified |
|------|---------|------------|----------|-----|----------|
| List | 8 tenants stretched rows | Vertical tenant list in cell | P1 | `NewsDeskTenantTargetsCell` | Yes |
| List | Heavy gradient header | Old design | P3 | Flat header | Yes |
| Detail | No web URL per tenant | API omitted `articleUrl` | P1 | Backend tenant-outcomes + `/articles/` URL | Yes (needs API restart) |
| Detail | No publish workflow clarity | V2 vs legacy split | P1 | `NewsDeskPublishBar` + legacy link | Yes |
| Detail | 9-row tenant table tall | All tenants expanded | P2 | Show 5 + expand | Yes |
| Create | Location unclear if saved | No preview | P2 | Section subtitle with live preview | Yes |
| Settings | Tab pills inconsistent | Old pattern | P3 | Underline tabs | Yes |
| Settings | Spinner stuck | Slow `listWebArticles` in analytics | P1 | Split load + timeout (prior session) | Yes |

---

## Tables (cross-module patterns)

| Pattern | Problem | Severity | Recommendation |
|---------|---------|----------|----------------|
| No `table-fixed` | Column blowout with Telugu text | P2 | Fixed columns + `line-clamp` |
| Missing skeletons | Spinner-only loading | P2 | Reuse `NewsDeskJobTable` skeleton pattern |
| Empty states | Plain text only | P3 | `EmptyState` component |
| Pagination | Some lists client-only | P2 | Audit per `articleService` / tenant lists |

---

## Forms (cross-module)

| Pattern | Problem | Severity | Recommendation |
|---------|---------|----------|----------------|
| Inline validation | Toast-only errors | P2 | `FormField` + inline for required fields |
| Double submit | No guard on some pages | P2 | `submitting` flag (News Desk create has it) |
| Location on desk | Free text, not master data dropdown | P2 | Optional picker from `/districts` API |

---

## Responsive

| Breakpoint | News Desk | Other modules |
|------------|-----------|---------------|
| Mobile | List → card layout in table | Mixed; epaper designer desktop-first |
| Tablet | OK | Sidebar overlay via `ModernMobileSidebar` |

---

## Accessibility (spot check)

| Item | Status |
|------|--------|
| News Desk table expand buttons | `aria-expanded` on tenant cell |
| Focus rings | Mixed — `components/ui` buttons OK |
| Telugu in tables | Needs `lang="te"` on cells (P3) |

---

## Modules not yet UI-audited in browser (backlog)

Epaper designer (`design.js` ~2000+ lines), tenant tab shell, journalist union tables — require dedicated passes (P2).

See `ADMIN_IMPLEMENTATION_PLAN.md` for phased rollout.