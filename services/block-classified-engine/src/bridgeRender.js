import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, '../../../../kaburlu_media_backend');

export function renderClassified(blockCode, classified) {
  const payload = JSON.stringify({ blockCode, classified });
  const r = spawnSync(
    'npx',
    ['ts-node', path.join(BACKEND_ROOT, 'scripts/render_classified_cli.ts')],
    {
      cwd: BACKEND_ROOT,
      input: payload,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || 'classified render failed');
  }
  return JSON.parse(r.stdout.trim());
}
