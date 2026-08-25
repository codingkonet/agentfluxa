import { getProviderConfig } from '../store/settings.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function sendMessage(messages, { model } = {}) {
  const stored = await getProviderConfig('openrouter');
  const apiKey = stored.apiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key is not set. Add it from the API dashboard or OPENROUTER_API_KEY env var.');
  }

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      // Optional but recommended by OpenRouter for attribution/rate-limit purposes.
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'AgentFLUXA',
    },
    body: JSON.stringify({
      model: model || stored.model || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}
