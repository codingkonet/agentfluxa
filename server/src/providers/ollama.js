import { getProviderConfig } from '../store/settings.js';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3.2';

// Ollama runs open models fully locally — no API key, no cost, no network
// calls beyond localhost. Install from https://ollama.com and `ollama pull <model>`.
export async function sendMessage(messages, { model } = {}) {
  const stored = await getProviderConfig('ollama');
  const baseUrl = (stored.baseUrl || process.env.OLLAMA_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const chosenModel = model || stored.model || process.env.OLLAMA_MODEL || DEFAULT_MODEL;

  let res;
  try {
    res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: chosenModel, messages, stream: false }),
    });
  } catch (err) {
    throw new Error(
      `Could not reach Ollama at ${baseUrl}. Install and start it from https://ollama.com, ` +
        `then run "ollama pull ${chosenModel}". (${err.message})`
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.message?.content ?? '';
}
