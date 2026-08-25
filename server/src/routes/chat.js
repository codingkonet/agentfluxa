import { Router } from 'express';
import * as openai from '../providers/openai.js';
import * as gemini from '../providers/gemini.js';
import * as openrouter from '../providers/openrouter.js';
import * as copilot from '../providers/copilot.js';

const providers = { openai, gemini, openrouter, copilot };
const router = Router();

router.post('/', async (req, res) => {
  const { provider, messages, model } = req.body ?? {};

  if (!provider || !providers[provider]) {
    return res.status(400).json({
      error: `Unknown provider "${provider}". Valid providers: ${Object.keys(providers).join(', ')}`,
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages must be a non-empty array' });
  }

  try {
    const reply = await providers[provider].sendMessage(messages, { model });
    res.json({ provider, reply });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
