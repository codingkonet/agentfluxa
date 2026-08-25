#!/usr/bin/env node
import readline from 'node:readline/promises';
import { stdin, stdout, argv, env } from 'node:process';

const VALID_PROVIDERS = ['openai', 'gemini', 'openrouter', 'copilot'];

const DEFAULT_URL = 'https://agentfluxa.com/api';

function parseArgs(args) {
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
  /provider <name>   Switch provider
  /clear             Clear conversation history
  /exit              Quit
`);
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
  let provider = opts.provider;
  const messages = [];

  console.log(`AgentFLUXA CLI — connected to ${baseUrl} (provider: ${provider})`);
  console.log('Type /help for commands, /exit to quit.\n');

  const rl = readline.createInterface({ input: stdin, output: stdout });

  while (true) {
    const line = (await rl.question(`${provider}> `)).trim();
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
        console.log(`Switched to ${provider}.`);
      }
      continue;
    }

    messages.push({ role: 'user', content: line });

    try {
      const res = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, messages, model: opts.model }),
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

main();
