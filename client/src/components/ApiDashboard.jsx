import { useEffect, useState } from 'react';

const PROVIDER_META = {
  openai: { label: 'OpenAI', fields: ['apiKey'], docs: 'https://platform.openai.com/api-keys' },
  gemini: { label: 'Gemini', fields: ['apiKey'], docs: 'https://aistudio.google.com/apikey' },
  openrouter: {
    label: 'OpenRouter',
    fields: ['apiKey', 'model'],
    docs: 'https://openrouter.ai/keys',
  },
  huggingface: {
    label: 'Hugging Face (free)',
    fields: ['apiKey', 'model'],
    docs: 'https://huggingface.co/settings/tokens',
  },
  ollama: {
    label: 'Ollama (local, free)',
    fields: ['baseUrl', 'model'],
    docs: 'https://ollama.com',
  },
  copilot: { label: 'Copilot', fields: [], docs: null },
};

export default function ApiDashboard({ token }) {
  const authHeaders = { Authorization: `Bearer ${token}` };
  const [settings, setSettings] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [status, setStatus] = useState({});
  const [error, setError] = useState('');

  async function refresh() {
    try {
      const res = await fetch('/api/settings', { headers: authHeaders });
      const data = await res.json();
      setSettings(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function updateDraft(provider, field, value) {
    setDrafts((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], [field]: value },
    }));
  }

  async function save(provider) {
    setStatus((s) => ({ ...s, [provider]: 'saving' }));
    try {
      const res = await fetch(`/api/settings/${provider}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(drafts[provider] || {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSettings(data);
      setDrafts((prev) => ({ ...prev, [provider]: {} }));
      setStatus((s) => ({ ...s, [provider]: 'saved' }));
    } catch (err) {
      setStatus((s) => ({ ...s, [provider]: 'error' }));
      setError(err.message);
    }
  }

  async function remove(provider) {
    setStatus((s) => ({ ...s, [provider]: 'saving' }));
    try {
      const res = await fetch(`/api/settings/${provider}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json();
      setSettings(data);
      setStatus((s) => ({ ...s, [provider]: 'removed' }));
    } catch (err) {
      setStatus((s) => ({ ...s, [provider]: 'error' }));
      setError(err.message);
    }
  }

  async function clearAll() {
    setStatus((s) => ({ ...s, all: 'clearing' }));
    try {
      await Promise.all(
        Object.keys(PROVIDER_META).map((provider) =>
          fetch(`/api/settings/${provider}`, {
            method: 'DELETE',
            headers: authHeaders,
          }),
        ),
      );
      await refresh();
      setStatus((s) => ({ ...s, all: 'cleared' }));
    } catch (err) {
      setStatus((s) => ({ ...s, all: 'error' }));
      setError(err.message);
    }
  }

  if (!settings) return <div className="dashboard">Loading…</div>;

  const configuredCount = Object.values(settings).filter((entry) => entry.configured).length;

  return (
    <div className="dashboard">
      <div className="admin-shell">
        <div className="admin-header">
          <div>
            <p className="eyebrow">Admin panel</p>
            <h2>Provider and model controls</h2>
          </div>
          <div className="admin-metrics">
            <span className="metric-pill">
              {configuredCount}/{Object.keys(PROVIDER_META).length} connected
            </span>
            <button className="secondary" onClick={refresh}>
              Refresh
            </button>
          </div>
        </div>

        <div className="admin-toolbar">
          <button onClick={refresh}>Sync settings</button>
          <button className="secondary" onClick={clearAll}>
            Clear all keys
          </button>
        </div>
      </div>

      <p className="dashboard-note">
        Keys are stored locally on this machine in <code>server/data/settings.json</code> (plaintext).
        Only run this dashboard on a trusted, local machine — never expose it over the network.
      </p>
      {error && <div className="bubble error">{error}</div>}

      {Object.entries(PROVIDER_META).map(([id, meta]) => {
        const entry = settings[id] || {};
        const draft = drafts[id] || {};
        return (
          <section key={id} className="provider-card">
            <div className="provider-card-header">
              <h3>{meta.label}</h3>
              <span className={`badge ${entry.configured ? 'ok' : 'off'}`}>
                {id === 'copilot' ? 'stub' : entry.configured ? 'configured' : 'not set'}
              </span>
            </div>

            {meta.fields.length === 0 ? (
              <p className="muted">No API key needed — this is a placeholder provider.</p>
            ) : (
              <>
                {meta.fields.includes('apiKey') && (
                  <label className="field">
                    <span>API key {entry.apiKeyMasked && `(current: ${entry.apiKeyMasked})`}</span>
                    <input
                      type="password"
                      placeholder="Paste API key…"
                      value={draft.apiKey || ''}
                      onChange={(e) => updateDraft(id, 'apiKey', e.target.value)}
                    />
                  </label>
                )}
                {meta.fields.includes('baseUrl') && (
                  <label className="field">
                    <span>Base URL (optional, e.g. {entry.baseUrl || 'http://localhost:11434'})</span>
                    <input
                      type="text"
                      placeholder={entry.baseUrl || 'http://localhost:11434'}
                      value={draft.baseUrl || ''}
                      onChange={(e) => updateDraft(id, 'baseUrl', e.target.value)}
                    />
                  </label>
                )}
                {meta.fields.includes('model') && (
                  <label className="field">
                    <span>Model (optional, e.g. {entry.model || 'openai/gpt-4o-mini'})</span>
                    <input
                      type="text"
                      placeholder={entry.model || 'openai/gpt-4o-mini'}
                      value={draft.model || ''}
                      onChange={(e) => updateDraft(id, 'model', e.target.value)}
                    />
                  </label>
                )}
                <div className="provider-card-actions">
                  <button onClick={() => save(id)}>Save</button>
                  <button className="secondary" onClick={() => remove(id)}>
                    Clear
                  </button>
                  {meta.docs && (
                    <a href={meta.docs} target="_blank" rel="noreferrer">
                      Get a key ↗
                    </a>
                  )}
                  {status[id] === 'saved' && <span className="status ok">Saved</span>}
                  {status[id] === 'removed' && <span className="status">Cleared</span>}
                  {status[id] === 'error' && <span className="status error">Error</span>}
                </div>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
