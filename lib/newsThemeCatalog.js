/** Publisher-inspired news homepage themes — Admin picker metadata */

export const NEWS_THEME_CATALOG = [
  {
    id: 'style1',
    label: 'Sakshi Classic',
    publisher: 'Sakshi-style',
    description: 'Traditional Telugu newspaper — maroon masthead, magazine hero, category grids',
    previewColors: { primary: '#7C1D2E', secondary: '#1F5D6B', accent: '#C8862A' },
    features: ['Magazine hero', '4-column rails', 'Category grids'],
  },
  {
    id: 'style2',
    label: 'Times of India (TOI)',
    publisher: 'TOI-style',
    description: '3-column TOI grid — left rail, center lead, trending sidebar',
    previewColors: { primary: '#0F4C5C', secondary: '#1B9AAA', accent: '#E09F3E' },
    features: ['TOI 3-column hero', 'Thumb lists', 'Magazine blocks'],
  },
  {
    id: 'style3',
    label: 'TV9 Breaking',
    publisher: 'TV9 Telugu-style',
    description: 'Breaking-news first — bold hero, trending ranks, top stories strip',
    previewColors: { primary: '#DC2626', secondary: '#1E293B', accent: '#F59E0B' },
    features: ['Breaking hero', 'Trending ranks', 'Top stories scroll'],
  },
  {
    id: 'style4',
    label: 'Samayam Lifestyle',
    publisher: 'Samayam Telugu-style',
    description: 'Lifestyle & metro — rounded cards, colorful sections, horizontal scroll',
    previewColors: { primary: '#EA580C', secondary: '#7C3AED', accent: '#059669' },
    features: ['Gradient hero', 'Lifestyle grid', 'Metro scroll'],
  },
  {
    id: 'style5',
    label: 'Call Kaburlu Modern',
    publisher: 'Call Kaburlu',
    description: 'Modern blue app UI — split hero, quick bites, tabs, mobile bottom nav',
    previewColors: { primary: '#1656F5', secondary: '#0D1117', accent: '#E23744' },
    features: ['Editor pick hero', 'Quick bites', 'Category tabs', 'Mobile app'],
  },
]

export const THEME_STYLE_ALIASES = {
  style1: 'style1', 'theme-1': 'style1', classic: 'style1', sakshi: 'style1',
  style2: 'style2', 'theme-2': 'style2', modern: 'style2', toi: 'style2',
  style3: 'style3', 'theme-3': 'style3', tv9: 'style3', breaking: 'style3',
  style4: 'style4', 'theme-4': 'style4', samayam: 'style4', lifestyle: 'style4',
  style5: 'style5', 'theme-5': 'style5', callkaburlu: 'style5', kaburlu: 'style5',
}

export function normalizeThemeStyleId(raw) {
  const key = String(raw || 'style1').toLowerCase().trim()
  return THEME_STYLE_ALIASES[key] || 'style1'
}
