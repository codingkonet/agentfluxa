import { useState } from 'react';

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'copilot', label: 'Copilot' },
  { id: 'openrouter', label: 'OpenRouter' },
];

const SYSTEM_PROMPT =
  'You are an expert coding assistant. Write correct, idiomatic code. When you include code, ' +
  'always wrap it in fenced code blocks (```language ... ```) and briefly explain the approach ' +
  'before or after the code.';

// Splits a reply into plain-text and fenced-code segments for rendering.
function parseSegments(text) {
  const segments = [];
  const fenceRe = /```(\w*)\n([\s\S]*?)```/g;
  let last = 0;
  let match;
  while ((match = fenceRe.exec(text))) {
    if (match.index > last) {
      segments.push({ type: 'text', content: text.slice(last, match.index) });
    }
    segments.push({ type: 'code', lang: match[1], content: match[2].replace(/\n$/, '') });
    last = fenceRe.lastIndex;
  }
  if (last < text.length) {
    segments.push({ type: 'text', content: text.slice(last) });
  }
  return segments;
}

function CodeBlock({ lang, content }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span>{lang || 'code'}</span>
        <button onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
      </div>
      <pre>
        <code>{content}</code>
      </pre>
    </div>
  );
}

function Message({ role, content }) {
  const segments = parseSegments(content);
  return (
    <div className={`bubble ${role}`}>
      <strong>{role === 'user' ? 'You' : 'Coder'}</strong>
      {segments.map((seg, i) =>
        seg.type === 'code' ? (
          <CodeBlock key={i} lang={seg.lang} content={seg.content} />
        ) : (
          <p key={i}>{seg.content}</p>
        )
      )}
    </div>
  );
}

export default function CodeHelper({ token }) {
  const authHeaders = { Authorization: `Bearer ${token}` };
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('');
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !attachment) || loading) return;

    const attachmentText = attachment
      ? `\n\nAttached file: ${attachment.name}\n\n\`\`\`${attachment.language}\n${attachment.content}\n\`\`\``
      : '';
    const nextMessages = [...messages, { role: 'user', content: `${text}${attachmentText}`.trim() }];
    setMessages(nextMessages);
    setInput('');
    setAttachment(null);
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          provider,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...nextMessages],
          model: model || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function chooseFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Files must be smaller than 2 MB');
      return;
    }
    setAttachment({ name: file.name, language: file.name.split('.').pop() || 'text', content: await file.text() });
  }

  return (
    <div className="coder">
      <div className="coder-toolbar">
        <span className="muted">Coding assistant — ask for snippets, fixes, or reviews.</span>
        <select value={provider} onChange={(e) => setProvider(e.target.value)}>
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          className="model-input"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="model (optional)"
        />
      </div>

      <main className="chat">
        {messages.map((m, i) => (
          <Message key={i} role={m.role} content={m.content} />
        ))}
        {loading && <div className="bubble assistant">Thinking…</div>}
        {error && <div className="bubble error">{error}</div>}
      </main>

      <form className="composer" onSubmit={sendMessage}>
        <label className="attach-button" title="Attach a text or code file">
          +
          <input type="file" onChange={chooseFile} accept=".txt,.md,.js,.jsx,.ts,.tsx,.json,.css,.html,.py,.java,.go,.rs,.sql" />
        </label>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for code, a fix, or a review..."
        />
        <button type="submit" disabled={loading}>
          Send
        </button>
      </form>
      {attachment && (
        <div className="attachment-chip">
          <span>Attached: {attachment.name}</span>
          <button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
