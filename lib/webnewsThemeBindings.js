/** Admin Domain Settings → kaburlu-Webnews v2 field map (for UI hints). */
export const WEBNEWS_THEME_BINDINGS = [
  { admin: 'Homepage layout', saves: 'layout', webnews: 'data-layout on <html>' },
  { admin: 'Masthead / logo display', saves: 'branding.header', webnews: 'BrandMark + classic-styles data-cmast' },
  { admin: 'Navigation style', saves: 'navigation.style + classic.nav', webnews: 'data-cnav + .catnav CSS' },
  { admin: 'Brand colors', saves: 'theme.colors', webnews: 'CSS variables --primary, --accent, …' },
  { admin: 'Typography', saves: 'theme.typography', webnews: '--font-head / --font-body + Google Fonts' },
  { admin: 'Contact', saves: 'contact', webnews: 'Footer address block + /contact' },
  { admin: 'Logo / favicon', saves: 'branding.logoUrl, faviconUrl', webnews: 'Header img + metadata icons' },
  { admin: 'Breaking ticker', saves: 'chrome.showTicker', webnews: '<Ticker> below header' },
  { admin: 'Top utility bar', saves: 'chrome.showTopBar', webnews: '.c-top (classic) / .topbar (other)' },
  { admin: 'Footer style', saves: 'footerStyle', webnews: 'data-footer on <html>' },
  { admin: 'Festival / mourning', saves: 'festivalThemes, mode', webnews: 'Festival engine + data-mode' },
  { admin: 'Custom CSS', saves: 'customCss', webnews: 'injected <style> in layout' },
  { admin: 'Menu items', saves: 'navigation.menu', webnews: 'CategoryNav links' },
  { admin: 'SEO tagline', saves: 'seo.tagline', webnews: 'masthead tagline' },
]

export const WEBNEWS_FOOTER_STYLES = [
  { value: 'minimal', label: 'Minimal', hint: 'Centered, light border — default' },
  { value: 'classic', label: 'Classic', hint: 'Brand bar + two-column links' },
  { value: 'rich', label: 'Rich', hint: 'Larger block, primary accent strip' },
]

export const WEBNEWS_RADIUS_OPTIONS = [
  { value: '0px', label: 'Sharp (patrika)' },
  { value: '6px', label: 'Soft' },
  { value: '10px', label: 'Magazine' },
  { value: '14px', label: 'Rounded cards' },
]