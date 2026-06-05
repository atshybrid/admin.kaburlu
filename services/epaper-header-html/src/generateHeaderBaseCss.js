/** Shared base + font import for all header styles */
import { FONTS } from './constants.js'

export function generateHeaderBaseCss() {
  return `@import url('https://fonts.googleapis.com/css2?family=Mandali&family=Inter:wght@400;600;700;800;900&display=swap');

.ep-header-slot {
  box-sizing: border-box;
  overflow: hidden;
  font-family: ${FONTS.telugu};
}

.ep-header-slot * {
  box-sizing: border-box;
}

.ep-placeholder {
  width: 100%;
  height: 100%;
  background: #f1f5f9;
  display: grid;
  place-items: center;
  font-family: ${FONTS.sans};
  font-size: 11px;
  color: #94a3b8;
}

.ep-header-slot img {
  display: block;
}

.ep-header-preview-wrap {
  width: 100%;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}
`
}
