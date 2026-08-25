import { getProviderConfig } from '../store/settings.js';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export async function sendMessage(messages, { model = 'gpt-4o-mini' } = {}) {
  const stored = await getProviderConfig('openai');
  const apiKey = stored.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not set. Add it from the API dashboard or OPENAI_API_KEY env var.');
  }

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}
