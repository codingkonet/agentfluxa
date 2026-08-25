import { useState } from 'react';
import ApiDashboard from './components/ApiDashboard.jsx';
import Landing from './components/Landing.jsx';
import CodeHelper from './components/CodeHelper.jsx';

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'copilot', label: 'Copilot' },
  { id: 'openrouter', label: 'OpenRouter' },
];

export default function App() {
  const [tab, setTab] = useState('home');
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('');
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
        body: JSON.stringify({ provider, messages: nextMessages, model: model || undefined }),
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
    <div className="app">
      <header className="header">
        <h1>AgentFLUXA</h1>
        <nav className="tabs">
          <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
            Home
          </button>
          <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
            Chat
          </button>
          <button className={tab === 'coder' ? 'active' : ''} onClick={() => setTab('coder')}>
            Coder
          </button>
          <button
            className={tab === 'dashboard' ? 'active' : ''}
            onClick={() => setTab('dashboard')}
          >
            API Dashboard
          </button>
        </nav>
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
        <ApiDashboard />
      ) : tab === 'coder' ? (
        <CodeHelper />
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
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${provider}...`}
            />
            <button type="submit" disabled={loading}>
              Send
            </button>
          </form>
        </>
      )}

      <footer className="footer">
        © {new Date().getFullYear()} AgentFLUXA. All rights reserved.
      </footer>
    </div>
  );
}
