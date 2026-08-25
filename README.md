# AgentFLUXA

A single chat UI that talks to multiple AI providers: **OpenAI**, **Google Gemini**, **OpenRouter**, and a **Copilot** placeholder.

## Structure

```
agentuxa/
  server/     Express API — proxies requests to each provider
  client/     React (Vite) chat UI
  cli/        Terminal client — chats via the same API
  extension/  VS Code extension — embeds the web app in a webview panel
```

## Setup

```bash
npm install
copy server\.env.example server\.env   # optional: fallback keys via env vars
```

You can also add/update/remove provider API keys at runtime from the **API Dashboard** tab in the app itself — no restart needed. Keys entered there are stored in `server/data/settings.json` (gitignored, plaintext) and take priority over the `.env` values. Only run this dashboard on a trusted local machine.

## Run (dev)

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:5174 (proxied under `/api` from the client)

## Terminal client (CLI)

The CLI talks to the same `/api/chat` endpoint as the web app, so it works against your local
dev server or a deployed instance.

```bash
npm run chat -- --url http://localhost:5174/api --provider openai
```

By default it points at `https://agentfluxa.com/api` (a placeholder until the backend is deployed
there) or `$AGENTFLUXA_API_URL` if set. While developing locally, always pass
`--url http://localhost:5174/api`.

In-chat commands: `/provider <name>`, `/clear`, `/help`, `/exit`.

You can also install it globally once published: `npm link` inside `cli/`, then run `agentfluxa`.

## VS Code extension

Embeds the AgentFLUXA web app in a VS Code webview panel.

1. Open this repo in VS Code and press **F5** (uses `.vscode/launch.json`) to launch an Extension
   Development Host.
2. In the new window, set `agentfluxa.url` in Settings to `http://localhost:5173` while `npm run dev`
   is running locally (defaults to `https://agentfluxa.com`, a placeholder until deployed).
3. Run the command **AgentFLUXA: Open** from the Command Palette (`Ctrl+Shift+P`).

## Providers

| Provider    | Notes |
|-------------|-------|
| `openai`     | Uses OpenAI Chat Completions API. Requires `OPENAI_API_KEY`. |
| `gemini`     | Uses Google Generative Language API. Requires `GEMINI_API_KEY`. |
| `openrouter` | Uses OpenRouter's OpenAI-compatible API. Requires `OPENROUTER_API_KEY`; model configurable via `OPENROUTER_MODEL`. |
| `copilot`    | **Stub only.** GitHub Copilot has no public chat-completions API. To get real Copilot responses, port `server/src/providers/copilot.js` into a VS Code extension and call `vscode.lm.selectChatModels()` there instead. |

## API

`GET /api/settings` — returns configured status + masked keys per provider.

`PUT /api/settings/:provider` — body `{ "apiKey": "...", "model": "..." }`, saves/updates that provider's config.

`DELETE /api/settings/:provider` — clears a provider's stored config.

`POST /api/chat`


```json
{
  "provider": "openai",
  "messages": [{ "role": "user", "content": "Hello!" }]
}
```

Response:

```json
{ "provider": "openai", "reply": "Hi there!" }
```
