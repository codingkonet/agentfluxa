const FEATURES = [
  {
    id: 'openai',
    title: 'OpenAI',
    blurb: 'Chat with GPT models using your own API key.',
  },
  {
    id: 'gemini',
    title: 'Gemini',
    blurb: "Talk to Google's Gemini models side by side with the rest.",
  },
  {
    id: 'openrouter',
    title: 'OpenRouter',
    blurb: 'Route to dozens of models through one OpenAI-compatible API.',
  },
  {
    id: 'copilot',
    title: 'Copilot',
    blurb: 'Placeholder slot, ready to wire into the VS Code Language Model API.',
  },
  {
    id: 'coder',
    title: 'Coder',
    blurb: 'A coding-focused assistant with fenced code blocks and one-click copy.',
  },
];

export default function Landing({ onStartChat, onOpenDashboard, onOpenCoder }) {
  return (
    <div className="landing">
      <section className="hero">
        <h2>One chat window. Every model.</h2>
        <p>
          AgentFLUXA connects OpenAI, Gemini, OpenRouter, and Copilot behind a single interface —
          add your API keys once, then switch providers per message.
        </p>
        <div className="hero-actions">
          <button className="cta primary" onClick={onStartChat}>
            Start chatting
          </button>
          <button className="cta secondary" onClick={onOpenCoder}>
            Open coding assistant
          </button>
          <button className="cta secondary" onClick={onOpenDashboard}>
            Manage API keys
          </button>
        </div>
      </section>

      <section className="feature-grid">
        {FEATURES.map((f) => (
          <div key={f.id} className="feature-card">
            <h3>{f.title}</h3>
            <p>{f.blurb}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
