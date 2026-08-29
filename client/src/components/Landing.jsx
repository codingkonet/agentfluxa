const CAPABILITIES = [
  {
    number: '01',
    title: 'Choose your model',
    blurb: 'Work with OpenAI, Gemini, OpenRouter, and local model routes from one focused workspace.',
  },
  {
    number: '02',
    title: 'Keep work in context',
    blurb: 'Attach code and text files, then carry the conversation from research through implementation.',
  },
  {
    number: '03',
    title: 'Act from your workspace',
    blurb: 'Use the terminal client to bring approved local files and web content into the model conversation.',
  },
];

export default function Landing({ onStartChat, onOpenDashboard, onOpenCoder }) {
  return (
    <main className="landing">
      <section className="landing-hero">
        <p className="landing-eyebrow">Agent workspace</p>
        <h2>AgentFLUXA</h2>
        <p className="landing-lede">
          A single place to talk with AI models, work through code, and bring trusted files and web
          research into the conversation.
        </p>
        <div className="hero-actions">
          <button className="cta primary" onClick={onStartChat}>Open chat</button>
          <button className="cta secondary" onClick={onOpenCoder}>Coding assistant</button>
        </div>
        <div className="landing-signal" aria-label="Available AI providers">
          <span>OpenAI</span><span>Gemini</span><span>OpenRouter</span><span>Copilot</span>
        </div>
      </section>

      <section className="landing-overview" aria-label="AgentFLUXA services">
        <p>Built for focused AI work</p>
        <strong>Chat, code, research, and configuration without changing tools.</strong>
        <button className="landing-text-link" onClick={onOpenDashboard}>Configure providers</button>
      </section>

      <section className="landing-capabilities">
        {CAPABILITIES.map((capability) => (
          <article key={capability.number} className="landing-capability">
            <span>{capability.number}</span>
            <h3>{capability.title}</h3>
            <p>{capability.blurb}</p>
          </article>
        ))}
      </section>

      <p className="landing-copyright">Copyright {new Date().getFullYear()} AgentFLUXA. All rights reserved.</p>
    </main>
  );
}
