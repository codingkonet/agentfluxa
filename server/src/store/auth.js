import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { promisify } from 'util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const scrypt = promisify(crypto.scrypt);

let cache;

async function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(AUTH_FILE, 'utf8'));
  } catch {
    cache = { users: [], sessions: {} };
  }
  return cache;
}

async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(AUTH_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export async function createUser({ name, email, password }) {
  const data = await load();
  const normalizedEmail = normalizeEmail(email);
  if (!name?.trim() || !normalizedEmail || !password) {
    throw new Error('Name, email, and password are required');
  }
  if (password.length < 8) throw new Error('Password must be at least 8 characters');
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new Error('Enter a valid email address');
  if (data.users.some((user) => user.email === normalizedEmail)) {
    throw new Error('An account with that email already exists');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    password: `${salt}:${derivedKey.toString('hex')}`,
  };
  data.users.push(user);
  cache = data;
  await persist();
  return publicUser(user);
}

export async function authenticate({ email, password }) {
  const data = await load();
  const user = data.users.find((item) => item.email === normalizeEmail(email));
  if (!user) throw new Error('Invalid email or password');
  const [salt, storedKey] = user.password.split(':');
  const derivedKey = await scrypt(password || '', salt, 64);
  const matches = crypto.timingSafeEqual(Buffer.from(storedKey, 'hex'), derivedKey);
  if (!matches) throw new Error('Invalid email or password');
  return publicUser(user);
}

export async function createSession(userId) {
  const data = await load();
  const token = crypto.randomBytes(32).toString('hex');
  data.sessions[token] = { userId, createdAt: Date.now() };
  cache = data;
  await persist();
  return token;
}

export async function getUserByToken(token) {
  if (!token) return null;
  const data = await load();
  const session = data.sessions[token];
  if (!session) return null;
  const user = data.users.find((item) => item.id === session.userId);
  return user ? publicUser(user) : null;
}

export async function removeSession(token) {
  const data = await load();
  delete data.sessions[token];
  cache = data;
  await persist();
}
