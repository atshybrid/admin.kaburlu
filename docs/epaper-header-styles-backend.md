# ePaper header & sub-header styles — backend reference

## Style numbers (store in DB)

| # | Key | Slug | English name |
|---|-----|------|----------------|
| **Main (page 1 masthead)** |
| 1 | `main_style1` | `classic_3_col_info_bar` | Classic 3-Col + Info Bar |
| 2 | `main_style2` | `prabha_3_col_meta_strip` | Prabha 3-Col + Meta Strip |
| 3 | `main_style3` | `minimal_white_left_align` | Minimal White Left-Align |
| 4 | `main_style4` | `red_crimson_banner` | Red / Crimson Banner |
| 5 | `main_style5` | `split_name_ad_panel` | Split — Name + Ad Panel |
| 6 | `main_style6` | `traditional_telugu_ornament` | Traditional Telugu Ornament |
| 7 | `main_style7` | `black_gold_premium` | Black / Gold Premium |
| 8 | `main_style8` | `blue_gradient` | Blue Gradient |
| 9 | `main_style9` | `heavy_rules_gothic` | Heavy Rules / Newspaper Gothic |
| 10 | `main_style10` | `modern_color_stripe` | Modern Color Stripe |
| **Sub (page 2+ running header)** |
| 1 | `sub_header_style1` | `page_logo_date` | Page · Logo · Date |
| 2 | `sub_header_style2` | `full_color_bar` | Full Color Bar |
| 3 | `sub_header_style3` | `top_rule_accent` | Top Rule Accent |
| 4 | `sub_header_style4` | `dark_strip` | Dark Strip |
| 5 | `sub_header_style5` | `left_section_flag` | Left Section Flag |
| 6 | `sub_header_style6` | `center_paper_name` | Center Paper Name |
| 7 | `sub_header_style7` | `bold_underlined_section` | Bold Underlined Section |
| 8 | `sub_header_style8` | `fully_bordered_box` | Fully Bordered Box |
| 9 | `sub_header_style9` | `two_tone_split` | Two-Tone Split |
| 10 | `sub_header_style10` | `traditional_telugu` | Traditional Telugu |

**Dimensions**

- Main tabloid: 12×2 in · Main broadsheet: 12×3 in  
- Sub tabloid: **11×1 in** · Sub broadsheet: **12×1 in**

## API fields to add / map

### `newspaper-config` (existing)

```json
{
  "config": {
    "headerStyleNumber": 2,
    "subHeaderStyleNumber": 1,
    "headerStyleKey": "main_style2",
    "subHeaderStyleKey": "sub_header_style1"
  }
}
```

### `design-config` (PATCH — add these)

```json
{
  "designConfig": {
    "headerStyleNumber": 2,
    "subHeaderStyleNumber": 1,
    "headerStyleKey": "main_style2",
    "subHeaderStyleKey": "sub_header_style1",
    "headerData": "తెలుగుప్రభ",
    "subHeaderData": "వార్తలు",
    "headerLogoUrl": "https://...",
    "subHeaderLogoUrl": "https://...",
    "paperNameImageUrl": "https://...",
    "headerLeftImageUrl": "https://...",
    "headerRightImageUrl": "https://...",
    "mainHeaderImageUrl": "",
    "subHeaderImageUrl": "",
    "publishedAreaText": "Hyderabad • Guntur",
    "paperSellCost": 6,
    "issueNumber": 106,
    "startVolumeNumber": 21,
    "tagline": "మన భాష.. మన పత్రిక",
    "websiteUrl": "www.example.net",
    "runningCommentText": "line1\nline2",
    "runningCommentAuthor": "- Author",
    "rightArticleTitle": "Headline",
    "rightArticlePoints": "point1\npoint2",
    "accentColor": "#dc2626"
  },
  "editionConfigs": [
    {
      "key": "edition:uuid",
      "headerStyleNumber": 2,
      "subHeaderStyleNumber": 1,
      "headerLogoUrl": "...",
      "subHeaderLogoUrl": "...",
      "paperNameImageUrl": "...",
      "headerLeftImageUrl": "...",
      "headerRightImageUrl": "..."
    }
  ]
}
```

## Frontend catalog endpoint

`GET /api/admin/epaper/header-styles` → full JSON list (names, keys, slugs, `settingsFields`, schema).

## Missing today (admin will show warnings until backend sends)

See `EPAPER_HEADER_DESIGN_CONFIG_SCHEMA` in `lib/epaper/headerStyleCatalog.js`.

Priority for **main_style2**: `runningCommentText`, `runningCommentAuthor`, `tagline`, `websiteUrl`, `rightArticleTitle`, `rightArticlePoints`, `headerLeftImageUrl`, `headerRightImageUrl`, `publishedAreaText`.

Priority for **sub_header_style1**: `subHeaderLogoUrl` (or `headerLogoUrl`), `date`, `pageNumber`.
