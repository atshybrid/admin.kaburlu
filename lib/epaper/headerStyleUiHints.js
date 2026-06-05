/**
 * Admin-only UI hints per style key (colors, required fields, preview dimensions).
 * Names/slugs come from media backend GET /public/epaper/header-styles.
 */
export const HEADER_STYLE_UI_HINTS = {
  main_style1: {
    color: '#ea580c',
    dimensions: { tabloid: { widthIn: 12, heightIn: 2 }, broadsheet: { widthIn: 12, heightIn: 3 } },
    settingsFields: [
      'paperName', 'paperNameEn', 'paperNameImageUrl', 'logoUrl',
      'adLeftUrl', 'adRightUrl', 'adUrl', 'publishedAreas',
      'date', 'volume', 'issue', 'price', 'accentColor', 'mainHeaderImageUrl',
    ],
  },
  main_style2: {
    color: '#0056a8',
    dimensions: { tabloid: { widthIn: 11, heightIn: 2.5 }, broadsheet: { widthIn: 12, heightIn: 3 } },
    settingsFields: [
      'paperName', 'paperNameImageUrl', 'runningCommentText', 'runningCommentAuthor',
      'tagline', 'websiteUrl', 'publishedAreas', 'date', 'volume', 'issue', 'price',
      'adLeftUrl', 'adRightUrl', 'rightArticleTitle', 'rightArticlePoints', 'pageNumber',
      'mainHeaderImageUrl', 'headerLogoUrl',
    ],
  },
  main_style3: {
    color: '#10b981',
    dimensions: { tabloid: { widthIn: 12, heightIn: 2 }, broadsheet: { widthIn: 12, heightIn: 3 } },
    settingsFields: [
      'paperName', 'paperNameEn', 'headerLogoUrl', 'date', 'volume', 'issue', 'price', 'accentColor',
      'astrologyDay', 'goldRate', 'silverRate',
    ],
  },
  main_style4: {
    color: '#dc2626',
    dimensions: { tabloid: { widthIn: 12, heightIn: 2 }, broadsheet: { widthIn: 12, heightIn: 3 } },
    settingsFields: ['paperName', 'paperNameEn', 'headerLogoUrl', 'date', 'accentColor', 'machiMata', 'twitterComment'],
  },
  main_style5: {
    color: '#8b5cf6',
    dimensions: { tabloid: { widthIn: 12, heightIn: 2 }, broadsheet: { widthIn: 12, heightIn: 3 } },
    settingsFields: [
      'paperName', 'paperNameEn', 'headerLogoUrl', 'date', 'weatherLines', 'petrolRate', 'dieselRate',
    ],
  },
  main_style6: {
    color: '#b45309',
    dimensions: { tabloid: { widthIn: 12, heightIn: 2 }, broadsheet: { widthIn: 12, heightIn: 3 } },
    settingsFields: ['paperName', 'paperNameEn', 'headerLogoUrl', 'date', 'volume', 'issue'],
  },
  main_style7: {
    color: '#fbbf24',
    dimensions: { tabloid: { widthIn: 12, heightIn: 2 }, broadsheet: { widthIn: 12, heightIn: 3 } },
    settingsFields: ['paperName', 'paperNameEn', 'headerLogoUrl', 'date', 'price'],
  },
  main_style8: {
    color: '#6366f1',
    dimensions: { tabloid: { widthIn: 12, heightIn: 2 }, broadsheet: { widthIn: 12, heightIn: 3 } },
    settingsFields: ['paperName', 'paperNameEn', 'headerLogoUrl', 'date'],
  },
  main_style9: {
    color: '#111111',
    dimensions: { tabloid: { widthIn: 12, heightIn: 2 }, broadsheet: { widthIn: 12, heightIn: 3 } },
    settingsFields: ['paperName', 'paperNameEn', 'date', 'volume', 'issue'],
  },
  main_style10: {
    color: '#ec4899',
    dimensions: { tabloid: { widthIn: 12, heightIn: 2 }, broadsheet: { widthIn: 12, heightIn: 3 } },
    settingsFields: ['paperName', 'paperNameEn', 'accentColor', 'date', 'headerLogoUrl'],
  },
  sub_header_style1: {
    color: '#6366f1',
    dimensions: { tabloid: { widthIn: 11, heightIn: 1 }, broadsheet: { widthIn: 12, heightIn: 1 } },
    settingsFields: ['pageNumber', 'date', 'subHeaderLogoUrl', 'headerLogoUrl', 'logoUrl', 'paperName'],
  },
  sub_header_style2: {
    color: '#ef4444',
    dimensions: { tabloid: { widthIn: 11, heightIn: 1 }, broadsheet: { widthIn: 12, heightIn: 1 } },
    settingsFields: ['sectionName', 'paperName', 'date', 'pageNumber', 'accentColor'],
  },
  sub_header_style3: {
    color: '#0ea5e9',
    dimensions: { tabloid: { widthIn: 11, heightIn: 1 }, broadsheet: { widthIn: 12, heightIn: 1 } },
    settingsFields: ['sectionName', 'date', 'pageNumber', 'accentColor'],
  },
  sub_header_style4: {
    color: '#1e293b',
    dimensions: { tabloid: { widthIn: 11, heightIn: 1 }, broadsheet: { widthIn: 12, heightIn: 1 } },
    settingsFields: ['sectionName', 'paperName', 'date', 'pageNumber'],
  },
  sub_header_style5: {
    color: '#10b981',
    dimensions: { tabloid: { widthIn: 11, heightIn: 1 }, broadsheet: { widthIn: 12, heightIn: 1 } },
    settingsFields: ['sectionName', 'date', 'pageNumber', 'accentColor'],
  },
  sub_header_style6: {
    color: '#8b5cf6',
    dimensions: { tabloid: { widthIn: 11, heightIn: 1 }, broadsheet: { widthIn: 12, heightIn: 1 } },
    settingsFields: ['paperName', 'sectionName', 'date', 'pageNumber'],
  },
  sub_header_style7: {
    color: '#f59e0b',
    dimensions: { tabloid: { widthIn: 11, heightIn: 1 }, broadsheet: { widthIn: 12, heightIn: 1 } },
    settingsFields: ['sectionName', 'date', 'pageNumber', 'accentColor'],
  },
  sub_header_style8: {
    color: '#475569',
    dimensions: { tabloid: { widthIn: 11, heightIn: 1 }, broadsheet: { widthIn: 12, heightIn: 1 } },
    settingsFields: ['sectionName', 'date', 'pageNumber', 'paperName'],
  },
  sub_header_style9: {
    color: '#ec4899',
    dimensions: { tabloid: { widthIn: 11, heightIn: 1 }, broadsheet: { widthIn: 12, heightIn: 1 } },
    settingsFields: ['sectionName', 'date', 'pageNumber', 'accentColor'],
  },
  sub_header_style10: {
    color: '#b45309',
    dimensions: { tabloid: { widthIn: 11, heightIn: 1 }, broadsheet: { widthIn: 12, heightIn: 1 } },
    settingsFields: ['sectionName', 'paperName', 'date', 'pageNumber'],
  },
}
