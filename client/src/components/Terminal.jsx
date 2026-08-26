import { useEffect, useRef, useState } from 'react';

const VALID_PROVIDERS = ['openai', 'gemini', 'openrouter', 'copilot'];

const HELP_TEXT = `Commands:
  /provider <name>   Switch provider (openai, gemini, openrouter, copilot)
  /model <name>      Set a model override (no argument clears it)
  /read <path>       Read a text file from the AgentFLUXA workspace
  /fetch <url>       Fetch a web page and add it to the conversation
  /clear             Clear the screen and conversation history
  /help              Show this help text`;

function Line({ line }) {
  return <div className={`term-line term-${line.kind}`}>{line.text}</div>;
}

export default function Terminal({ token }) {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('');
  const [messages, setMessages] = useState([]);
  const [lines, setLines] = useState([
    { kind: 'system', text: 'AgentFLUXA terminal — type /help for commands.' },
    { kind: 'system', text: `Provider: openai` },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  function print(text, kind = 'output') {
    setLines((current) => [...current, { kind, text }]);
  }

  async function runCommand(raw) {
    const [cmd, ...rest] = raw.trim().split(/\s+/);
    const arg = rest.join(' ');

    if (cmd === '/help') {
      print(HELP_TEXT, 'system');
      return;
    }

    if (cmd === '/clear') {
      setLines([]);
      setMessages([]);
      return;
    }

    if (cmd === '/provider') {
      const next = arg.trim().toLowerCase();
      if (!VALID_PROVIDERS.includes(next)) {
        print(`Unknown provider "${arg}". Valid: ${VALID_PROVIDERS.join(', ')}`, 'error');
        return;
      }
      setProvider(next);
      print(`Provider set to ${next}`, 'system');
      return;
    }

    if (cmd === '/model') {
      setModel(arg.trim());
      print(arg.trim() ? `Model set to ${arg.trim()}` : 'Model override cleared', 'system');
      return;
    }

    if (cmd === '/read') {
      if (!arg.trim()) {
        print('Usage: /read <path>', 'error');
        return;
      }
      try {
        const res = await fetch('/api/tools/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ path: arg.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Read failed');
        setMessages((current) => [
          ...current,
          { role: 'user', content: `Attached file ${data.path}:\n\n\`\`\`\n${data.content}\n\`\`\`` },
        ]);
        print(`Added ${data.path} to the conversation.`, 'system');
      } catch (err) {
        print(err.message, 'error');
      }
      return;
    }

    if (cmd === '/fetch') {
      if (!arg.trim()) {
        print('Usage: /fetch <url>', 'error');
        return;
      }
      try {
        const res = await fetch('/api/tools/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ url: arg.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Fetch failed');
        setMessages((current) => [
          ...current,
          { role: 'user', content: `Content fetched from ${data.url}:\n\n${data.content}` },
        ]);
        print(`Added ${data.url} to the conversation.`, 'system');
      } catch (err) {
        print(err.message, 'error');
      }
      return;
    }

    print(`Unknown command: ${cmd}. Type /help for a list of commands.`, 'error');
  }

  async function sendChat(text) {
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ provider, messages: nextMessages, model: model || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }]);
      print(data.reply, 'assistant');
    } catch (err) {
      print(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const value = input;
    if (!value.trim() || busy) return;
    setInput('');
    setHistory((current) => [...current, value]);
    setHistoryIndex(null);
    print(`${provider}${model ? `:${model}` : ''}> ${value}`, 'prompt');

    if (value.trim().startsWith('/')) {
      await runCommand(value);
      return;
    }
    await sendChat(value.trim());
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowUp') {
      if (history.length === 0) return;
      e.preventDefault();
      const nextIndex = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      if (historyIndex === null) return;
      e.preventDefault();
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(null);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      }
    }
  }

  function changeProvider(next) {
    setProvider(next);
    print(`Provider set to ${next}`, 'system');
    inputRef.current?.focus();
  }

  return (
    <main className="terminal" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-toolbar" onClick={(e) => e.stopPropagation()}>
        <select value={provider} onChange={(e) => changeProvider(e.target.value)} aria-label="Provider">
          {VALID_PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          className="model-input"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="model (optional)"
          aria-label="Model override"
        />
      </div>
      <div className="terminal-screen" ref={scrollRef}>
        {lines.map((line, i) => (
          <Line key={i} line={line} />
        ))}
        {busy && <div className="term-line term-system">Thinking…</div>}
      </div>
      <form className="terminal-input-row" onSubmit={handleSubmit}>
        <span className="terminal-prompt">{provider}{model ? `:${model}` : ''}&gt;</span>
        <input
          ref={inputRef}
          className="terminal-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          placeholder="Type a message or /help"
        />
      </form>
    </main>
  );
}
