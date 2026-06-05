-- BLOCK-06A layout engine — PostgreSQL schema
-- Run: npm run db:migrate (from services/block06-engine)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS block_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_code VARCHAR(32) NOT NULL UNIQUE,
  label VARCHAR(128) NOT NULL,
  width_mm NUMERIC(8, 2) NOT NULL,
  max_height_mm NUMERIC(8, 2) NOT NULL,
  min_words INTEGER NOT NULL DEFAULT 150,
  max_words INTEGER NOT NULL DEFAULT 300,
  column_count SMALLINT NOT NULL DEFAULT 2,
  column_gap_px INTEGER NOT NULL DEFAULT 16,
  body_font_px SMALLINT NOT NULL DEFAULT 11,
  body_line_px SMALLINT NOT NULL DEFAULT 14,
  rules_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(64),
  edition_id VARCHAR(64),
  edition_date DATE,
  page_number SMALLINT NOT NULL,
  paper_preset VARCHAR(32) NOT NULL DEFAULT 'BROADSHEET',
  page_width_mm NUMERIC(8, 2) NOT NULL DEFAULT 330.2,
  page_height_mm NUMERIC(8, 2) NOT NULL DEFAULT 577.85,
  article_area_width_mm NUMERIC(8, 2) NOT NULL DEFAULT 304.8,
  layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT page_layouts_page_unique UNIQUE (tenant_id, edition_id, edition_date, page_number)
);

CREATE TABLE IF NOT EXISTS page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_layout_id UUID NOT NULL REFERENCES page_layouts(id) ON DELETE CASCADE,
  block_template_id UUID REFERENCES block_templates(id),
  block_code VARCHAR(32) NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  row_index SMALLINT,
  column_index SMALLINT,
  slot_width_mm NUMERIC(8, 2),
  article_id VARCHAR(64),
  render_html TEXT,
  render_css TEXT,
  word_count INTEGER,
  estimated_height_mm NUMERIC(8, 2),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_valid BOOLEAN NOT NULL DEFAULT false,
  validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_layouts_edition
  ON page_layouts (tenant_id, edition_id, edition_date);

CREATE INDEX IF NOT EXISTS idx_page_blocks_layout
  ON page_blocks (page_layout_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_page_blocks_article
  ON page_blocks (article_id);

COMMENT ON TABLE block_templates IS 'Newspaper block specs (BLOCK-06A, etc.)';
COMMENT ON TABLE page_layouts IS 'Per-page layout plan for an edition';
COMMENT ON TABLE page_blocks IS 'Rendered block instances on a page';
