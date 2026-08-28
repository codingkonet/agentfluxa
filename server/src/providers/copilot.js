// GitHub Copilot has no public chat-completions API for use outside VS Code.
// Real responses come from the VS Code Language Model API (vscode.lm), wired
// up in extension/src/extension.js and bridged to the web app over
// postMessage (see client/src/lib/copilotBridge.js). This stub only answers
// when AgentFLUXA is used as a plain website, outside the VS Code extension.
export async function sendMessage(messages) {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  return (
    'Copilot is only available when AgentFLUXA is opened via the VS Code extension ' +
    '(Ctrl+Shift+P → "AgentFLUXA: Open") while signed in to GitHub Copilot. ' +
    `You asked: "${lastUserMessage?.content ?? ''}"`
  );
}
