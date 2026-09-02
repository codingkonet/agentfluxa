import { Router } from 'express';
import * as openai from '../providers/openai.js';
import * as gemini from '../providers/gemini.js';
import * as openrouter from '../providers/openrouter.js';
import * as copilot from '../providers/copilot.js';
import * as huggingface from '../providers/huggingface.js';
import * as ollama from '../providers/ollama.js';
import { getProviderConfig } from '../store/settings.js';

const providers = { openai, gemini, openrouter, copilot, huggingface, ollama };
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
    const providerConfig = await getProviderConfig(req.user.id, provider);
    const reply = await providers[provider].sendMessage(messages, { model, providerConfig });
    res.json({ provider, reply });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
