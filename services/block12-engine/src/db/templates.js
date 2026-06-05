import { IN_MEMORY_TEMPLATE } from '../constants.js'
import { query } from './pool.js'

export async function fetchBlockTemplate(blockCode = 'BLOCK-12A') {
  if (process.env.BLOCK12_SKIP_DB === 'true') {
    return IN_MEMORY_TEMPLATE
  }

  const res = await query(
    `SELECT block_code, width_mm, max_height_mm, min_words, max_words,
            column_count, column_gap_px, body_font_px, body_line_px, rules_json
     FROM block_templates
     WHERE block_code = $1 AND is_active = true
     LIMIT 1`,
    [blockCode]
  )

  if (!res?.rows?.length) {
    return IN_MEMORY_TEMPLATE
  }

  return res.rows[0]
}
