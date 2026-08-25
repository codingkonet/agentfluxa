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

export default function CodeHelper() {
  const [provider, setProvider] = useState('openai');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...nextMessages],
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
      </div>

      <main className="chat">
        {messages.map((m, i) => (
          <Message key={i} role={m.role} content={m.content} />
        ))}
        {loading && <div className="bubble assistant">Thinking…</div>}
        {error && <div className="bubble error">{error}</div>}
      </main>

      <form className="composer" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for code, a fix, or a review..."
        />
        <button type="submit" disabled={loading}>
          Send
        </button>
      </form>
    </div>
  );
}
