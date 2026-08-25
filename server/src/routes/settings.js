import { Router } from 'express';
import {
  getPublicSettings,
  saveProviderConfig,
  clearProviderConfig,
} from '../store/settings.js';

const VALID_PROVIDERS = ['openai', 'gemini', 'openrouter', 'copilot'];
const router = Router();

router.get('/', async (_req, res) => {
  res.json(await getPublicSettings());
});

router.put('/:provider', async (req, res) => {
  const { provider } = req.params;
  if (!VALID_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: `Unknown provider "${provider}"` });
  }
  try {
    const settings = await saveProviderConfig(provider, req.body ?? {});
    res.json(settings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:provider', async (req, res) => {
  const { provider } = req.params;
  if (!VALID_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: `Unknown provider "${provider}"` });
  }
  res.json(await clearProviderConfig(provider));
});

export default router;
