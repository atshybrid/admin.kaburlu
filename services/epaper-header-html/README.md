# ePaper Header HTML Engine

Node service that renders **page 1 main masthead** and **page 2+ sub-headers** as HTML/CSS from JSON settings.

## Dimensions (auto-fit by preset)

| Preset | Content width | Main height | Sub height |
|--------|---------------|-------------|------------|
| **Broadsheet** | 12″ (13″ trim − 0.5″ margins) | 3″ | 1″ |
| **Tabloid** | 11″ (full 11″ trim) | 2.5″ | 0.7″ |

Recommended combo (Eenadu / Andhra Jyothy style):

- Page 1 → **Main Style 2** (18% · 64% · 18% grid)
- Page 2+ → **Sub Style 2** (red section bar)

## Run

```bash
cd admin.kaburlu/services/epaper-header-html
npm install
npm run dev
```

- Demo: http://localhost:3099/static/demo.html
- Preview: http://localhost:3099/layout/epaper-header/preview?preset=broadsheet&mainStyle=2&subStyle=2

## API

```http
POST /layout/epaper-header/render
Content-Type: application/json

{
  "preset": "broadsheet",
  "headerStyleNumber": 2,
  "subHeaderStyleNumber": 2,
  "settings": {
    "paperName": "భారత్ దర్శన్",
    "sectionName": "రాజకీయాలు",
    "date": "03 జూన్ 2026",
    "pageNumber": "2",
    "accentColor": "#dc2626"
  }
}
```

Styles: `main_style1` … `main_style2` (full), `sub_header_style1` … `sub_header_style2` (full), 3–10 generic fallback.
