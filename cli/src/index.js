#!/usr/bin/env node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout, argv, env } from 'node:process';
import { pathToFileURL } from 'node:url';

const VALID_PROVIDERS = ['openai', 'gemini', 'openrouter', 'copilot'];
const DEFAULT_URL = 'https://agentfluxa.com/api';
const DEFAULT_SESSION_PATH = path.join(os.homedir(), '.agentfluxa', 'session.json');

const MODEL_OPTIONS = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'],
  gemini: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
  openrouter: ['openai/gpt-4o-mini', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'deepseek/deepseek-chat'],
  copilot: ['copilot-gpt-4o-mini', 'copilot'],
};

export function parseArgs(args) {
  const opts = { provider: 'openai', url: env.AGENTFLUXA_API_URL || DEFAULT_URL };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--url' || arg === '-u') opts.url = args[++i];
    else if (arg === '--provider' || arg === '-p') opts.provider = args[++i];
    else if (arg === '--model' || arg === '-m') opts.model = args[++i];
    else if (arg === '--help' || arg === '-h') opts.help = true;
  }
  return opts;
}

export function getModelOptions(provider) {
  return MODEL_OPTIONS[provider] || ['default'];
}

function printHelp() {
  console.log(`AgentFLUXA CLI — chat with OpenAI, Gemini, OpenRouter or Copilot from your terminal.

Usage:
  agentfluxa [--url <base-url>] [--provider <name>] [--model <name>]

Options:
  -u, --url       Base API URL (default: $AGENTFLUXA_API_URL or ${DEFAULT_URL})
                  Point this at your local server while developing, e.g.
                  --url http://localhost:5174/api
  -p, --provider  openai | gemini | openrouter | copilot (default: openai)
  -m, --model     Optional model override passed to the provider
  -h, --help      Show this help

In-chat commands:
  /provider <name>      Switch provider
  /model <name>        Switch model
  /read <path>         Read a text file from the AgentFLUXA workspace
  /fetch <url>         Fetch a web page and add it to the conversation
  /clear               Clear conversation history
  /exit                Quit
`);
}

async function loadSession(sessionPath = DEFAULT_SESSION_PATH) {
  try {
    const raw = await fs.readFile(sessionPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveSession(session, sessionPath = DEFAULT_SESSION_PATH) {
  await fs.mkdir(path.dirname(sessionPath), { recursive: true });
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf8');
}

async function apiRequest(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

async function loginOrRegister(rl, baseUrl) {
  console.log('\nAccount\n1) Login\n2) Register\n3) Continue as guest\n4) Exit\n');
  const answer = (await rl.question('Choose an option: ')).trim();

  if (!answer || answer === '3') {
    return { token: null, user: null };
  }

  if (answer === '4') {
    process.exit(0);
  }

  if (answer === '1' || answer === '2') {
    const isLogin = answer === '1';
    const name = isLogin ? '' : (await rl.question('Name: ')).trim();
    const email = (await rl.question('Email: ')).trim();
    const password = (await rl.question('Password: ')).trim();

    const endpoint = isLogin ? `${baseUrl}/auth/login` : `${baseUrl}/auth/signup`;
    const payload = isLogin ? { email, password } : { name, email, password };

    const data = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (data.token) {
      await saveSession({ token: data.token, user: data.user });
      console.log(`\nWelcome ${data.user?.name || data.user?.email || 'back'}!\n`);
      return { token: data.token, user: data.user };
    }

    return { token: null, user: null };
  }

  console.log('Invalid option. Please choose 1, 2, 3, or 4.');
  return loginOrRegister(rl, baseUrl);
}

function defaultModel(provider) {
  return getModelOptions(provider)[0];
}

async function promptModelChoice(rl, provider, currentModel) {
  const choices = getModelOptions(provider);
  console.log(`\nAvailable models for ${provider}:`);
  choices.forEach((model, index) => {
    console.log(`${index + 1}) ${model}`);
  });
  console.log('0) Use default');

  const answer = (await rl.question(`Choose a model [${currentModel || defaultModel(provider)}]: `)).trim();
  if (!answer || answer === '0') return currentModel || defaultModel(provider);

  const picked = Number(answer);
  if (Number.isInteger(picked) && picked >= 1 && picked <= choices.length) {
    return choices[picked - 1];
  }

  const custom = answer.trim();
  if (custom) return custom;
  return currentModel || defaultModel(provider);
}

async function main() {
  const opts = parseArgs(argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }
  if (!VALID_PROVIDERS.includes(opts.provider)) {
    console.error(`Unknown provider "${opts.provider}". Valid: ${VALID_PROVIDERS.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const baseUrl = opts.url.replace(/\/+$/, '');
  const rl = readline.createInterface({ input: stdin, output: stdout });

  let session = await loadSession();
  if (session?.token) {
    console.log(`Welcome back, ${session.user?.name || session.user?.email || 'friend'}!`);
  }

  const auth = await loginOrRegister(rl, baseUrl);
  if (auth.token) {
    session = auth;
  }

  let provider = opts.provider;
  let model = opts.model || defaultModel(provider);

  console.log(`\nAgentFLUXA CLI — connected to ${baseUrl} (provider: ${provider})`);
  console.log('Type /help for commands, /exit to quit.\n');

  if (!opts.model) {
    model = await promptModelChoice(rl, provider, model);
  }

  const messages = [];

  while (true) {
    const line = (await rl.question(`${provider}:${model}> `)).trim();
    if (!line) continue;

    if (line === '/exit' || line === '/quit') break;
    if (line === '/help') {
      printHelp();
      continue;
    }
    if (line === '/clear') {
      messages.length = 0;
      console.log('Conversation cleared.');
      continue;
    }
    if (line.startsWith('/provider')) {
      const next = line.split(/\s+/)[1];
      if (!VALID_PROVIDERS.includes(next)) {
        console.log(`Unknown provider "${next}". Valid: ${VALID_PROVIDERS.join(', ')}`);
      } else {
        provider = next;
        model = opts.model || defaultModel(provider);
        console.log(`Switched to ${provider}.`);
      }
      continue;
    }
    if (line.startsWith('/model')) {
      const next = line.split(/\s+/)[1];
      if (next) {
        model = next;
        console.log(`Model set to ${model}.`);
      } else {
        model = await promptModelChoice(rl, provider, model);
      }
      continue;
    }

    if (line.startsWith('/read ')) {
      try {
        const data = await apiRequest(`${baseUrl}/tools/read`, {
          method: 'POST',
          headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
          body: JSON.stringify({ path: line.slice(6).trim() }),
        });
        messages.push({ role: 'user', content: `Read workspace file ${data.path}:\n\n${data.content}` });
        console.log(`Added ${data.path} to the conversation.`);
      } catch (err) {
        console.error(`\nError: ${err.message}\n`);
      }
      continue;
    }

    if (line.startsWith('/fetch ')) {
      try {
        const data = await apiRequest(`${baseUrl}/tools/fetch`, {
          method: 'POST',
          headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
          body: JSON.stringify({ url: line.slice(7).trim() }),
        });
        messages.push({ role: 'user', content: `Fetched URL ${data.url} (HTTP ${data.status}):\n\n${data.content}` });
        console.log(`Added ${data.url} to the conversation.`);
      } catch (err) {
        console.error(`\nError: ${err.message}\n`);
      }
      continue;
    }

    messages.push({ role: 'user', content: line });

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (session?.token) {
        headers.Authorization = `Bearer ${session.token}`;
      }

      const res = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ provider, messages, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      messages.push({ role: 'assistant', content: data.reply });
      console.log(`\n${data.reply}\n`);
    } catch (err) {
      console.error(`\nError: ${err.message}\n`);
    }
  }

  rl.close();
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  main();
}

export default main;
