import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderClassified } from './bridgeRender.js';
import { getClassifiedSample } from './sampleData.js';
import { CLASSIFIED_6C, CLASSIFIED_12C, ENGINE_VERSION } from './constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3100;

const SHELL_CSS = `
.stage { min-height: 100vh; padding: 24px; background: #64748b; display: flex; flex-direction: column; align-items: center; gap: 24px; }
.stage .paper { box-shadow: 0 8px 32px rgba(0,0,0,0.25); }
`;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/static', express.static(path.join(__dirname, '../public')));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'block-classified-engine',
    engineVersion: ENGINE_VERSION,
    blocks: [CLASSIFIED_6C.code, CLASSIFIED_12C.code],
    port: PORT,
    urls: {
      demo: `http://localhost:${PORT}/static/demo.html`,
      preview6: `http://localhost:${PORT}/layout/classified/preview?blockCode=CLASSIFIED-6C`,
      preview12: `http://localhost:${PORT}/layout/classified/preview?blockCode=CLASSIFIED-12C`,
    },
  });
});

app.get('/', (_req, res) => res.redirect('/static/demo.html'));

app.post('/layout/classified/render', (req, res) => {
  try {
    const blockCode = req.body?.blockCode || 'CLASSIFIED-6C';
    const classified = req.body?.classified || req.body;
    const result = renderClassified(blockCode, classified);
    res.json({ valid: !result.isRejected, ...result });
  } catch (e) {
    res.status(500).json({ valid: false, error: e.message });
  }
});

app.get('/layout/classified/preview', (req, res) => {
  try {
    const blockCode = String(req.query.blockCode || 'CLASSIFIED-6C').toUpperCase();
    const classified = getClassifiedSample();
    const variant = blockCode.includes('12') ? '12C' : '6C';
    classified.editionLabel =
      variant === '12C'
        ? 'హైదరాబాద్ · బుధవారం, 03-06-2026'
        : '03-06-2026';
    const result = renderClassified(blockCode, classified);
    const html = `<!DOCTYPE html>
<html lang="te"><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Telugu:wght@400;700&family=Mandali&display=swap" rel="stylesheet"/>
<style>body{margin:0;font-family:system-ui}.bar{background:#1e1b4b;color:#fff;padding:10px 16px;font-size:13px}
${SHELL_CSS}${result.css}</style></head><body>
<div class="bar"><strong>${result.blockCode}</strong> · ${result.adCount} ads · ${result.columnCount} cols</div>
<div class="stage"><div class="paper">${result.html}</div></div></body></html>`;
    res.type('html').send(html);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.listen(PORT, () => {
  console.log(`Classified Block Engine → http://localhost:${PORT}`);
  console.log(`  Demo     → http://localhost:${PORT}/static/demo.html`);
  console.log(`  6C       → http://localhost:${PORT}/layout/classified/preview?blockCode=CLASSIFIED-6C`);
  console.log(`  12C      → http://localhost:${PORT}/layout/classified/preview?blockCode=CLASSIFIED-12C`);
});
