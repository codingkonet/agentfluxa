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
    panel.onDidDispose(() => {
      panel = undefined;
    });
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent(url) {
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; frame-src ${safeUrl} https: http:; style-src 'unsafe-inline';"
    />
    <style>
      html, body, iframe { height: 100%; margin: 0; padding: 0; border: none; width: 100%; }
    </style>
  </head>
  <body>
    <iframe src="${safeUrl}" title="AgentFLUXA"></iframe>
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
