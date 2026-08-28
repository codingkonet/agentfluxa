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

By default it points at `https://agentfluxa.com/api` (the live deployment) or `$AGENTFLUXA_API_URL`
if set. While developing locally, pass `--url http://localhost:5174/api` instead.

In-chat commands: `/provider <name>`, `/clear`, `/help`, `/exit`.

You can also install it globally once published: `npm link` inside `cli/`, then run `agentfluxa`.

## VS Code extension

Embeds the AgentFLUXA web app in a VS Code webview panel.

1. Open this repo in VS Code and press **F5** (uses `.vscode/launch.json`) to launch an Extension
   Development Host.
2. In the new window, set `agentfluxa.url` in Settings to `http://localhost:5173` while `npm run dev`
   is running locally (defaults to `https://agentfluxa.com`, the live deployment).
3. Run the command **AgentFLUXA: Open** from the Command Palette (`Ctrl+Shift+P`).

## Providers

| Provider    | Notes |
|-------------|-------|
| `openai`     | Uses OpenAI Chat Completions API. Requires `OPENAI_API_KEY`. |
| `gemini`     | Uses Google Generative Language API. Requires `GEMINI_API_KEY`. |
| `openrouter` | Uses OpenRouter's OpenAI-compatible API. Requires `OPENROUTER_API_KEY`; model configurable via `OPENROUTER_MODEL`. |
| `copilot`    | Real responses when opened via the **VS Code extension** while signed in to GitHub Copilot (uses `vscode.lm.selectChatModels`, bridged to the web app over `postMessage`). Falls back to a stub message when used as a plain website. |

## API

`GET /api/settings` — returns configured status + masked keys per provider.

`PUT /api/settings/:provider` — body `{ "apiKey": "...", "model": "..." }`, saves/updates that provider's config.

`DELETE /api/settings/:provider` — clears a provider's stored config.

`POST /api/tools/read` — reads a text file inside `AGENTFLUXA_WORKSPACE` (maximum 2 MB).

`POST /api/tools/fetch` — fetches an HTTP or HTTPS URL (maximum 2 MB response).

Tool access requires authentication and is restricted to these explicit operations. The model
does not receive unrestricted filesystem or network access.

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

In the terminal, use `/read path/to/file` or `/fetch https://example.com` to add local or web
content to the next model request.
