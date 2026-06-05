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
  'BLOCK-06A',
  '6 inch · 2 column · feature story',
  152.4,
  254.0,
  150,
  300,
  2,
  16,
  11,
  14,
  '{
    "locked": true,
    "engineVersion": "threaded-v3.4",
    "overflow": "hidden",
    "titleMaxLines": 3,
    "titleAlign": "center",
    "subtitleSizeRatio": 0.5,
    "maxHighlights": 2,
    "maxImages": 1,
    "column1": ["highlights", "body_start"],
    "column2": ["image", "body_continue"]
  }'::jsonb
)
ON CONFLICT (block_code) DO UPDATE SET
  width_mm = EXCLUDED.width_mm,
  max_height_mm = EXCLUDED.max_height_mm,
  min_words = EXCLUDED.min_words,
  max_words = EXCLUDED.max_words,
  rules_json = EXCLUDED.rules_json,
  updated_at = NOW();
