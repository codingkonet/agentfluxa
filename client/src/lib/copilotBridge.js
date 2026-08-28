// Bridges the "copilot" provider to VS Code's Language Model API when this app
// is embedded inside the AgentFLUXA VS Code extension webview. The extension
// host owns the real GitHub Copilot session (sign-in, entitlements, models),
// so the browser app can never call Copilot directly — it must ask the host.
let counter = 0;

export function isEmbeddedInExtensionHost() {
  return window.parent !== window;
}

export function requestCopilotReply(messages, model, timeoutMs = 60000) {
  if (!isEmbeddedInExtensionHost()) {
    return Promise.reject(
      new Error('Real Copilot access requires opening AgentFLUXA via the VS Code extension (Ctrl+Shift+P → "AgentFLUXA: Open") while signed in to GitHub Copilot.')
    );
  }

  const id = `copilot-${Date.now()}-${counter++}`;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error('Copilot request timed out. Make sure you are signed in to GitHub Copilot in VS Code.'));
    }, timeoutMs);

    function onMessage(event) {
      const data = event.data;
      if (!data || data.type !== 'copilot-response' || data.id !== id) return;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      if (data.error) reject(new Error(data.error));
      else resolve(data.reply);
    }

    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: 'copilot-request', id, messages, model }, '*');
  });
}
