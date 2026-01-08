/**
 * Icon Components - Consistent SVG icon library
 * All icons use 24x24 viewBox with 2px stroke
 */

// Helper for consistent icon props
const iconProps = (props) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: props?.className || "w-5 h-5",
  ...props
})

// Navigation & Menu Icons
export const IconMenu = (props) => (
  <svg {...iconProps(props)}><path d="M3 6h18M3 12h18M3 18h18"/></svg>
)

export const IconX = (props) => (
  <svg {...iconProps(props)}><path d="M18 6L6 18M6 6l12 12"/></svg>
)

export const IconChevronDown = (props) => (
  <svg {...iconProps(props)}><path d="M6 9l6 6 6-6"/></svg>
)

export const IconChevronUp = (props) => (
  <svg {...iconProps(props)}><path d="M18 15l-6-6-6 6"/></svg>
)

export const IconChevronLeft = (props) => (
  <svg {...iconProps(props)}><path d="M15 18l-6-6 6-6"/></svg>
)

export const IconChevronRight = (props) => (
  <svg {...iconProps(props)}><path d="M9 18l6-6-6-6"/></svg>
)

export const IconMoreVertical = (props) => (
  <svg {...iconProps(props)}><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
)

export const IconExternalLink = (props) => (
  <svg {...iconProps(props)}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
)

// User & People Icons
export const IconUsers = (props) => (
  <svg {...iconProps(props)}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
)

export const IconUser = (props) => (
  <svg {...iconProps(props)}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)

export const IconLogout = (props) => (
  <svg {...iconProps(props)}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
)

// Content & File Icons
export const IconFolder = (props) => (
  <svg {...iconProps(props)}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
)

export const IconFileText = (props) => (
  <svg {...iconProps(props)}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
)

export const IconArticles = (props) => (
  <svg {...iconProps(props)}><path d="M4 6h16M4 10h16M4 14h10"/></svg>
)

export const IconLayers = (props) => (
  <svg {...iconProps(props)}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
)

// Action Icons
export const IconPlus = (props) => (
  <svg {...iconProps(props)}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
)

export const IconEdit = (props) => (
  <svg {...iconProps(props)}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
)

export const IconTrash = (props) => (
  <svg {...iconProps(props)}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
)

export const IconEye = (props) => (
  <svg {...iconProps(props)}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
)

export const IconRefresh = (props) => (
  <svg {...iconProps(props)}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
)

export const IconSearch = (props) => (
  <svg {...iconProps(props)}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
)

export const IconCheck = (props) => (
  <svg {...iconProps(props)}><polyline points="20 6 9 17 4 12"/></svg>
)

// Status & Alert Icons
export const IconAlertCircle = (props) => (
  <svg {...iconProps(props)}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
)

export const IconBell = (props) => (
  <svg {...iconProps(props)}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
)

// Stats & Chart Icons
export const IconTrendingUp = (props) => (
  <svg {...iconProps(props)}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
)

export const IconTrendingDown = (props) => (
  <svg {...iconProps(props)}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
)

export const IconBarChart = (props) => (
  <svg {...iconProps(props)}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
)

export const IconClock = (props) => (
  <svg {...iconProps(props)}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)

// Location Icons
export const IconGeo = (props) => (
  <svg {...iconProps(props)}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
)

export const IconMapPin = (props) => (
  <svg {...iconProps(props)}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
)

export const IconGlobe = (props) => (
  <svg {...iconProps(props)}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
)

// Building & Organization Icons
export const IconBuilding = (props) => (
  <svg {...iconProps(props)}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
)

export const IconTenant = (props) => (
  <svg {...iconProps(props)}><path d="M3 21V7l9-4 9 4v14"/><path d="M9 10h6"/><path d="M9 14h6"/><path d="M9 18h6"/></svg>
)

export const IconHome = (props) => (
  <svg {...iconProps(props)}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
)

// Settings & Security Icons
export const IconSettings = (props) => (
  <svg {...iconProps(props)}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
)

export const IconShield = (props) => (
  <svg {...iconProps(props)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
)

export const IconKey = (props) => (
  <svg {...iconProps(props)}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
)

export const IconCreditCard = (props) => (
  <svg {...iconProps(props)}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
)

export const IconLang = (props) => (
  <svg {...iconProps(props)}><path d="M4 5h7M4 9h7M4 13h5"/><path d="M14 5h6M16 9h4M18 13h2"/></svg>
)
