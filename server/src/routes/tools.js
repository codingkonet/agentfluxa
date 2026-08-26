import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultWorkspace = path.resolve(__dirname, '../../..');
const workspaceRoot = path.resolve(process.env.AGENTFLUXA_WORKSPACE || defaultWorkspace);
const MAX_FILE_SIZE = 2 * 1024 * 1024;

function safePath(relativePath) {
  const resolved = path.resolve(workspaceRoot, relativePath || '');
  if (resolved !== workspaceRoot && !resolved.startsWith(`${workspaceRoot}${path.sep}`)) {
    throw new Error('Path must stay inside the configured AgentFLUXA workspace');
  }
  return resolved;
}

router.post('/read', async (req, res) => {
  try {
    const filePath = safePath(req.body?.path);
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) throw new Error('Only files can be read');
    if (stats.size > MAX_FILE_SIZE) throw new Error('File is larger than 2 MB');
    res.json({ path: path.relative(workspaceRoot, filePath), content: await fs.readFile(filePath, 'utf8') });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/fetch', async (req, res) => {
  try {
    const target = new URL(req.body?.url);
    if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Only HTTP and HTTPS URLs are allowed');
    const response = await fetch(target, { signal: AbortSignal.timeout(10000) });
    const text = await response.text();
    res.status(response.ok ? 200 : 502).json({ url: target.toString(), status: response.status, content: text.slice(0, MAX_FILE_SIZE) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;