import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const PROVIDER_FIELDS = {
  openai: ['apiKey'],
  gemini: ['apiKey'],
  openrouter: ['apiKey', 'model'],
  copilot: [],
  huggingface: ['apiKey', 'model'],
  ollama: ['baseUrl', 'model'],
};

let cache = null;

async function load() {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
    cache = JSON.parse(raw);
  } catch {
    cache = {};
  }
  return cache;
}

async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

function mask(value) {
  if (!value) return null;
  return value.length <= 4 ? '••••' : `${'•'.repeat(value.length - 4)}${value.slice(-4)}`;
}

export async function getPublicSettings() {
  const settings = await load();
  const result = {};
  for (const provider of Object.keys(PROVIDER_FIELDS)) {
    const entry = settings[provider] || {};
    result[provider] = {
      configured: Boolean(entry.apiKey) || Boolean(entry.baseUrl),
      apiKeyMasked: mask(entry.apiKey),
      model: entry.model || null,
      baseUrl: entry.baseUrl || null,
    };
  }
  return result;
}

export async function getProviderConfig(provider) {
  const settings = await load();
  return settings[provider] || {};
}

export async function saveProviderConfig(provider, fields) {
  if (!(provider in PROVIDER_FIELDS)) {
    throw new Error(`Unknown provider "${provider}"`);
  }
  const settings = await load();
  const allowed = PROVIDER_FIELDS[provider];
  const current = settings[provider] || {};
  const next = { ...current };
  for (const key of allowed) {
    if (fields[key] !== undefined && fields[key] !== '') {
      next[key] = fields[key];
    }
  }
  settings[provider] = next;
  cache = settings;
  await persist();
  return getPublicSettings();
}

export async function clearProviderConfig(provider) {
  const settings = await load();
  delete settings[provider];
  cache = settings;
  await persist();
  return getPublicSettings();
}
