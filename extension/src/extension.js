const vscode = require('vscode');

let panel;

function activate(context) {
  const disposable = vscode.commands.registerCommand('agentfluxa.open', () => {
    const url = vscode.workspace.getConfiguration('agentfluxa').get('url');

    if (panel) {
      panel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    panel = vscode.window.createWebviewPanel(
      'agentfluxa',
      'AgentFLUXA',
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    panel.webview.html = getWebviewContent(url);
    panel.webview.onDidReceiveMessage((message) => handleWebviewMessage(message));
    panel.onDidDispose(() => {
      panel = undefined;
    });
  });

  context.subscriptions.push(disposable);
}

async function handleWebviewMessage(message) {
  if (!panel || !message || message.type !== 'copilot-request') return;
  const { id, messages, model } = message;
  try {
    const reply = await runCopilotRequest(messages, model);
    panel.webview.postMessage({ type: 'copilot-response', id, reply });
  } catch (err) {
    panel.webview.postMessage({ type: 'copilot-response', id, error: err.message || String(err) });
  }
}

async function runCopilotRequest(messages, model) {
  const family = (model || '').trim() || undefined;
  const [chatModel] = await vscode.lm.selectChatModels({ vendor: 'copilot', ...(family ? { family } : {}) });
  if (!chatModel) {
    throw new Error('No GitHub Copilot chat model is available. Sign in to GitHub Copilot in VS Code and try again.');
  }

  const chatMessages = (messages || []).map((m) =>
    m.role === 'assistant'
      ? vscode.LanguageModelChatMessage.Assistant(m.content)
      : vscode.LanguageModelChatMessage.User(m.content)
  );

  const cancellation = new vscode.CancellationTokenSource();
  const response = await chatModel.sendRequest(chatMessages, {}, cancellation.token);
  let reply = '';
  for await (const fragment of response.text) {
    reply += fragment;
  }
  return reply;
}

function getWebviewContent(url) {
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; frame-src ${safeUrl} https: http:; style-src 'unsafe-inline'; script-src 'unsafe-inline';"
    />
    <style>
      html, body, iframe { height: 100%; margin: 0; padding: 0; border: none; width: 100%; }
    </style>
  </head>
  <body>
    <iframe id="app" src="${safeUrl}" title="AgentFLUXA"></iframe>
    <script>
      const vscodeApi = acquireVsCodeApi();
      const iframe = document.getElementById('app');

      // Relay Copilot requests/responses between the embedded web app and the extension host.
      window.addEventListener('message', (event) => {
        const data = event.data;
        if (!data) return;
        if (data.type === 'copilot-response') {
          iframe.contentWindow.postMessage(data, '*');
        } else if (data.type === 'copilot-request') {
          vscodeApi.postMessage(data);
        }
      });
    </script>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function deactivate() {}

module.exports = { activate, deactivate };

