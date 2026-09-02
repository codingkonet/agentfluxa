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
    cache = { users: {} };
  }
  if (!cache.users) cache = { users: {} };
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

export async function getPublicSettings(userId) {
  const settings = (await load()).users[userId] || {};
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

export async function getProviderConfig(userId, provider) {
  const settings = (await load()).users[userId] || {};
  return settings[provider] || {};
}

export async function saveProviderConfig(userId, provider, fields) {
  if (!(provider in PROVIDER_FIELDS)) {
    throw new Error(`Unknown provider "${provider}"`);
  }
  const data = await load();
  const settings = data.users[userId] || {};
  const allowed = PROVIDER_FIELDS[provider];
  const current = settings[provider] || {};
  const next = { ...current };
  for (const key of allowed) {
    if (fields[key] !== undefined && fields[key] !== '') {
      next[key] = fields[key];
    }
  }
  settings[provider] = next;
  data.users[userId] = settings;
  cache = data;
  await persist();
  return getPublicSettings(userId);
}

export async function clearProviderConfig(userId, provider) {
  const data = await load();
  const settings = data.users[userId] || {};
  delete settings[provider];
  data.users[userId] = settings;
  cache = data;
  await persist();
  return getPublicSettings(userId);
}
