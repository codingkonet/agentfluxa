import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const BILLING_FILE = path.join(DATA_DIR, 'billing.json');

const DEFAULT_BILLING = {
  plans: {
    free: {
      name: 'Free',
      price: '$0',
      detail: 'For exploration and personal workflows',
      features: ['Core chat access', 'Community support', 'Basic tool integrations'],
      enabled: true,
    },
    paid: {
      name: 'Pro',
      price: '$29',
      detail: 'Best for daily work and prototypes',
      features: ['Everything in Free', 'Priority support', 'Advanced automations'],
      enabled: false,
    },
  },
  paypal: {
    email: '',
    apiKey: '',
  },
};

let cache = null;

async function load() {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(BILLING_FILE, 'utf-8');
    cache = JSON.parse(raw);
  } catch {
    cache = structuredClone(DEFAULT_BILLING);
  }
  return cache;
}

async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(BILLING_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

function mask(value) {
  if (!value) return null;
  return value.length <= 4 ? '••••' : `${'•'.repeat(value.length - 4)}${value.slice(-4)}`;
}

export async function getPublicBilling() {
  const billing = await load();
  return {
    plans: billing.plans,
    paypal: {
      email: billing.paypal.email || '',
      configured: Boolean(billing.paypal.apiKey),
      apiKeyMasked: mask(billing.paypal.apiKey),
    },
  };
}

export async function savePlan(planId, fields) {
  if (!['free', 'paid'].includes(planId)) {
    throw new Error(`Unknown plan "${planId}"`);
  }
  const billing = await load();
  const current = billing.plans[planId];
  const next = { ...current };
  if (fields.name !== undefined) next.name = String(fields.name).trim() || current.name;
  if (fields.price !== undefined) next.price = String(fields.price).trim() || current.price;
  if (fields.detail !== undefined) next.detail = String(fields.detail);
  if (fields.enabled !== undefined) next.enabled = Boolean(fields.enabled);
  if (Array.isArray(fields.features)) {
    next.features = fields.features.map((f) => String(f).trim()).filter(Boolean);
  }
  billing.plans[planId] = next;
  cache = billing;
  await persist();
  return getPublicBilling();
}

export async function savePaypalConfig(fields) {
  const billing = await load();
  const next = { ...billing.paypal };
  if (fields.email !== undefined) next.email = String(fields.email).trim();
  if (fields.apiKey !== undefined && fields.apiKey !== '') {
    next.apiKey = String(fields.apiKey).trim();
  }
  billing.paypal = next;
  cache = billing;
  await persist();
  return getPublicBilling();
}

export async function clearPaypalConfig() {
  const billing = await load();
  billing.paypal = { email: '', apiKey: '' };
  cache = billing;
  await persist();
  return getPublicBilling();
}
