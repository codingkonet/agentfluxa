import { useState } from 'react';

const CAPABILITIES = [
  {
    number: '01',
    title: 'Multi-Model Orchestration',
    blurb: 'Work with OpenAI (GPT-4o), Gemini, Hugging Face, OpenRouter, Copilot, and local Ollama models from one workspace.',
  },
  {
    number: '02',
    title: 'Autonomous Multi-Step Logic',
    blurb: 'AgentFLUXA breaks complex goals into sub-tasks, executes tools independently, and validates results.',
  },
  {
    number: '03',
    title: 'Privacy & Local Execution',
    blurb: 'Run open-weights models through local Ollama instances with zero cloud exposure for maximum privacy.',
  },
  {
    number: '04',
    title: 'Web & File Workspace Tools',
    blurb: 'Attach code/documents and leverage built-in web scrapers, static code analyzers, and CLI runners.',
  },
];

const PRESET_DEMOS = [
  {
    id: 'web',
    label: '🌐 Web Research',
    title: 'Scrape & Summarize Market News',
    output: `[AgentFLUXA] Initializing task: Market Research
[Provider] OpenAI gpt-4o selected
[Tool Execution] Running Cheerio web scraper on target sources...
[Parser] Extracted 12 headlines and 3 core articles.

✨ SUMMARY REPORT:
1. Multi-agent orchestration is becoming the developer standard.
2. Local execution with Ollama provides cost-effective, privacy-first automation.
3. Hybrid routing reduces overall latency while preserving accuracy.`,
  },
  {
    id: 'code',
    label: '💻 Code Refactor',
    title: 'Refactor Async Functions & Types',
    output: `[AgentFLUXA] Analyzing TypeScript code...
[Tool Execution] Running AST static analysis...
[Issue Found] Missing cleanup in event listener & unhandled promise rejection.

✅ REFACTORED CODE:
export async function fetchData(signal) {
  const res = await fetch('/api/scan', { signal });
  return res.json();
}`,
  },
];

const FAQS = [
  {
    q: 'What is AgentFLUXA?',
    a: 'AgentFLUXA is an autonomous AI agent service and multi-provider workspace that allows you to connect multiple LLMs (OpenAI, Gemini, Ollama, Hugging Face, Copilot) to automate web research, coding, data parsing, and terminal workflows.',
  },
  {
    q: 'Can I run AgentFLUXA offline?',
    a: 'Yes! AgentFLUXA integrates natively with local Ollama models (e.g. Llama 3.2 or Mistral). In local mode, zero data leaves your local machine.',
  },
  {
    q: 'How do I start using AgentFLUXA?',
    a: 'Simply click "Open chat" or "Coding assistant" above, pick your preferred AI provider, and start defining your tasks.',
  },
];

export default function Landing({ onStartChat, onOpenDashboard, onOpenCoder }) {
  const [activeDemo, setActiveDemo] = useState(PRESET_DEMOS[0]);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="landing">
      <section className="landing-hero">
        <p className="landing-eyebrow">Autonomous AI Agent Platform</p>
        <h2>AgentFLUXA</h2>
        <p className="landing-lede">
          One unified workspace to orchestrate top AI models, analyze code, execute local tool calls,
          and conduct web research seamlessly.
        </p>
        <div className="hero-actions">
          <button className="cta primary" onClick={onStartChat}>Open Chat</button>
          <button className="cta secondary" onClick={onOpenCoder}>Coding Assistant</button>
          <button className="cta secondary" onClick={onOpenDashboard}>Configure Providers</button>
        </div>
        <div className="landing-signal" aria-label="Available AI providers">
          <span>OpenAI (GPT-4o)</span>
          <span>Gemini 1.5</span>
          <span>Hugging Face</span>
          <span>Ollama (Local)</span>
          <span>GitHub Copilot</span>
        </div>
      </section>

      {/* Interactive Sandbox Demo */}
      <section className="landing-overview" aria-label="Interactive Demo">
        <p>Interactive Agent Playground</p>
        <strong>Experience Autonomous Task Execution</strong>
        <div style={{ display: 'flex', gap: '10px', margin: '1rem 0', justifyContent: 'center' }}>
          {PRESET_DEMOS.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setActiveDemo(demo)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid ' + (activeDemo.id === demo.id ? '#8b5cf6' : '#333'),
                background: activeDemo.id === demo.id ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                color: activeDemo.id === demo.id ? '#c084fc' : '#aaa',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {demo.label}
            </button>
          ))}
        </div>
        <pre
          style={{
            textAlign: 'left',
            background: '#090d16',
            border: '1px solid #222',
            padding: '16px',
            borderRadius: '10px',
            color: '#38bdf8',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: '0 auto',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {activeDemo.output}
        </pre>
      </section>

      {/* Core Capabilities */}
      <section className="landing-capabilities">
        {CAPABILITIES.map((capability) => (
          <article key={capability.number} className="landing-capability">
            <span>{capability.number}</span>
            <h3>{capability.title}</h3>
            <p>{capability.blurb}</p>
          </article>
        ))}
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '2rem 1rem', maxWidth: '720px', margin: '0 auto' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.4rem' }}>
          Frequently Asked Questions
        </h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {FAQS.map((faq, idx) => (
            <div
              key={faq.q}
              style={{
                background: '#14171d',
                border: '1px solid #2a2e39',
                borderRadius: '10px',
                padding: '12px 16px',
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: '#edf2f7',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>{faq.q}</span>
                <span>{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && (
                <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <p className="landing-copyright">Copyright {new Date().getFullYear()} AgentFLUXA. All rights reserved.</p>
    </main>
  );
}
