import { getProviderConfig } from '../store/settings.js';

const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek-ai/DeepSeek-V3-0324:fastest';

// Hugging Face's Inference Providers router — a free-tier, OpenAI-compatible
// gateway to many open-weight models (DeepSeek, Llama, Qwen, etc.).
export async function sendMessage(messages, { model } = {}) {
  const stored = await getProviderConfig('huggingface');
  const apiKey = stored.apiKey || process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Hugging Face token is not set. Add a free token from https://huggingface.co/settings/tokens ' +
        'via the API dashboard or HUGGINGFACE_API_KEY env var.'
    );
  }

  const res = await fetch(HF_ROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || stored.model || process.env.HUGGINGFACE_MODEL || DEFAULT_MODEL,
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hugging Face request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}
