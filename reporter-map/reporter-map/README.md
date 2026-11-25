# Telangana Reporter Coverage Map (Next.js)

District → Mandal drill-down map. Two styles: **Colour + Pins** (classic colourful district map, mandal pins with reporter count — black = covered, red = gap) and **Heatmap**. Paper-wise filter, reporter counts, coverage gaps (0-reporter mandals).

## Files to copy into your project
```
components/reporter-map/TelanganaReporterMap.tsx
components/reporter-map/TelanganaReporterMap.module.css
components/reporter-map/types.ts
public/geo/telangana-districts.json      # 33 districts
public/geo/telangana-mandals.json        # 459 mandals (each has id, name, districtId, district)
public/geo/telangana-mandals-list.csv    # mandalId list — seed your DB / reporter form dropdown
```
`npm i d3-geo && npm i -D @types/d3-geo @types/geojson`

## Usage
```tsx
<TelanganaReporterMap reporters={reporters} papers={["Kaburlu Daily", "Gramam News"]} />
```
Each reporter: `{ id, name, paper, mandalId, phone?, role? }` — `mandalId` must match the CSV
(e.g. `nalgonda--miryalaguda`). Reporters with an unknown mandalId are shown as a warning, not counted.

## DB (Prisma example)
```prisma
model Reporter {
  id        String @id @default(cuid())
  tenantId  String          // paper
  name      String
  phone     String?
  role      String?
  mandalId  String          // from telangana-mandals-list.csv
  districtId String
  @@index([tenantId, mandalId])
}
```
Replace `app/api/reporters/route.ts` sample generator with your query.

## Data notes
- Boundaries: datta07/INDIAN-SHAPEFILES (LGD-coded, 2016–19 district set), mandals reassigned to the 33 current districts.
  Renamed: Warangal Urban → Hanumakonda, Warangal Rural → Warangal.
- 459 mandal polygons. Telangana now has ~612 mandals — newer mandals (2016+ splits, 2022 additions) are
  inside their parent polygon. Map those reporters to the parent mandalId, or swap in an updated mandal GeoJSON
  with the same property names (id, name, districtId, district).
