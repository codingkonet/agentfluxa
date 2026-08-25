// GitHub Copilot has no public chat-completions API. This is a placeholder
// that can be swapped for the VS Code Language Model API (vscode.lm) when
// this backend is run from within a VS Code extension host.
export async function sendMessage(messages) {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  return (
    'Copilot provider is a stub. Wire this up to the VS Code Language Model API ' +
    '(vscode.lm.selectChatModels) inside an extension host to get real responses. ' +
    `You asked: "${lastUserMessage?.content ?? ''}"`
  );
}
