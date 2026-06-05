INSERT INTO block_templates (
  block_code,
  label,
  width_mm,
  max_height_mm,
  min_words,
  max_words,
  column_count,
  column_gap_px,
  body_font_px,
  body_line_px,
  rules_json
) VALUES (
  'BLOCK-08A',
  '8 inch · 3 column · feature story',
  203.2,
  254.0,
  180,
  380,
  3,
  16,
  11,
  14,
  '{
    "locked": true,
    "engineVersion": "threaded-v1.0",
    "widthIn": 8,
    "overflow": "hidden",
    "titleMaxLines": 3,
    "maxHighlights": 2,
    "maxImages": 2,
    "column1": ["highlights", "body_start"],
    "column2": ["image_primary", "body_continue"],
    "column3": ["image_secondary", "body_continue"]
  }'::jsonb
)
ON CONFLICT (block_code) DO UPDATE SET
  label = EXCLUDED.label,
  width_mm = EXCLUDED.width_mm,
  max_height_mm = EXCLUDED.max_height_mm,
  min_words = EXCLUDED.min_words,
  max_words = EXCLUDED.max_words,
  column_count = EXCLUDED.column_count,
  rules_json = EXCLUDED.rules_json,
  updated_at = NOW();
