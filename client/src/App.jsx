import { useEffect, useState } from 'react';
import ApiDashboard from './components/ApiDashboard.jsx';
import Auth from './components/Auth.jsx';
import Landing from './components/Landing.jsx';
import CodeHelper from './components/CodeHelper.jsx';
import Tools from './components/Tools.jsx';
import Terminal from './components/Terminal.jsx';
import { isEmbeddedInExtensionHost, requestCopilotReply } from './lib/copilotBridge.js';

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'copilot', label: 'Copilot' },
  { id: 'openrouter', label: 'OpenRouter' },
];

export default function App() {
  const [auth, setAuth] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('agentfluxa_theme') || 'midnight');
  const [tab, setTab] = useState('home');
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('');
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('agentfluxa_token');
    if (!token) {
      setAuthLoading(false);
      return;
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Session expired'))))
      .then(({ user }) => setAuth({ user, token }))
      .catch(() => localStorage.removeItem('agentfluxa_token'))
      .finally(() => setAuthLoading(false));
  }, []);

  if (authLoading) return <div className={`auth-loading theme-${theme}`}>Loading AgentFLUXA...</div>;
  if (!auth) return <div className={`theme-${theme}`}><Auth onAuthenticated={(user, token) => setAuth({ user, token })} /></div>;

  const authHeaders = { Authorization: `Bearer ${auth.token}` };

  function changeTheme(nextTheme) {
    setTheme(nextTheme);
    localStorage.setItem('agentfluxa_theme', nextTheme);
  }

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
      let reply;
      if (provider === 'copilot' && isEmbeddedInExtensionHost()) {
        reply = await requestCopilotReply(nextMessages, model || undefined);
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ provider, messages: nextMessages, model: model || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        reply = data.reply;
      }
      setMessages([...nextMessages, { role: 'assistant', content: reply }]);
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
    <div className={`app theme-${theme}`}>
      <header className="header">
        <h1>AgentFLUXA</h1>
        <nav className="tabs">
          <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
            Home
          </button>
          <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
            Chat
          </button>
          <button className={tab === 'terminal' ? 'active' : ''} onClick={() => setTab('terminal')}>
            Terminal
          </button>
          <button className={tab === 'coder' ? 'active' : ''} onClick={() => setTab('coder')}>
            Coder
          </button>
          <button className={tab === 'tools' ? 'active' : ''} onClick={() => setTab('tools')}>
            Tools
          </button>
          <button
            className={tab === 'dashboard' ? 'active' : ''}
            onClick={() => setTab('dashboard')}
          >
            API Dashboard
          </button>
        </nav>
        <select
          className="theme-select"
          value={theme}
          onChange={(e) => changeTheme(e.target.value)}
          aria-label="Choose app theme"
        >
          <option value="midnight">Midnight</option>
          <option value="light">Light</option>
          <option value="aurora">Aurora</option>
        </select>
        {tab === 'chat' && (
          <>
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
          </>
        )}
      </header>

      {tab === 'home' ? (
        <Landing
          onStartChat={() => setTab('chat')}
          onOpenDashboard={() => setTab('dashboard')}
          onOpenCoder={() => setTab('coder')}
        />
      ) : tab === 'dashboard' ? (
        <ApiDashboard token={auth.token} />
      ) : tab === 'terminal' ? (
        <Terminal token={auth.token} />
      ) : tab === 'coder' ? (
        <CodeHelper token={auth.token} />
      ) : tab === 'tools' ? (
        <Tools />
      ) : (
        <>
          <main className="chat">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                <strong>{m.role === 'user' ? 'You' : provider}</strong>
                <p>{m.content}</p>
              </div>
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
              placeholder={`Message ${provider}...`}
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
        </>
      )}

      <footer className="footer">
        © {new Date().getFullYear()} AgentFLUXA. All rights reserved.
      </footer>
    </div>
  );
}
