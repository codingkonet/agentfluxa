import { useMemo } from 'react';

const highlights = [
  { value: '24/7', label: 'Autonomous task flow' },
  { value: '12+', label: 'Tool integrations' },
  { value: '4x', label: 'Faster project setup' },
  { value: '100%', label: 'Private by default' },
];

const capabilities = [
  {
    title: 'Research that moves',
    text: 'Collect facts, compare sources, and turn scattered input into a clear action plan.',
  },
  {
    title: 'Code with context',
    text: 'Review files, explain logic, and generate changes without losing the original project context.',
  },
  {
    title: 'Operate across tools',
    text: 'Move from browser tasks to terminal actions and internal workflows without context switching.',
  },
];

const steps = [
  { id: '01', title: 'Connect your workspace', text: 'Link the tools, repositories, and AI providers you trust.' },
  { id: '02', title: 'Define the objective', text: 'Tell the agent what outcome matters and what constraints matter most.' },
  { id: '03', title: 'Let it execute', text: 'Receive updates, artifacts, and recommendations as the workflow completes.' },
];

const plans = [
  { name: 'Free', price: '$0', detail: 'For exploration and personal workflows', featured: false },
];

export default function Landing({ onStartChat, onOpenDashboard, onOpenCoder }) {
  const stats = useMemo(
    () => ({
      review: '11k+',
      uptime: '99.9%',
      latency: '< 2s',
    }),
    []
  );

  return (
    <main className="orbital-landing">
      <section className="hero-shell">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-dot" />
            <span className="brand-name">AgentFLUXA</span>
          </div>

          <nav className="topnav" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#plans">Pricing</a>
          </nav>

          <button className="ghost-button" onClick={onOpenDashboard}>
            Open dashboard
          </button>
        </header>

        <div className="hero-grid">
          <div className="hero-copy">
            <span className="badge">AI operations for real teams</span>
            <h1>Turn scattered work into a guided execution engine.</h1>
            <p>
              AgentFLUXA helps your team research, write, review, and automate work from a single
              calm interface. It keeps context, tools, and actions connected without the usual
              chaos.
            </p>

            <div className="cta-row">
              <button className="primary-button" onClick={onStartChat}>
                Start workspace
              </button>
              <button className="secondary-button" onClick={onOpenCoder}>
                Try the coder
              </button>
            </div>

            <div className="meta-row" aria-label="Key stats">
              <div>
                <strong>{stats.review}</strong>
                <span>Tasks reviewed</span>
              </div>
              <div>
                <strong>{stats.uptime}</strong>
                <span>Uptime</span>
              </div>
              <div>
                <strong>{stats.latency}</strong>
                <span>Response time</span>
              </div>
            </div>
          </div>

          <div className="hero-panel">
            <div className="signal-card">
              <div className="signal-header">
                <span className="pulse" />
                <span>Live workflow</span>
              </div>

              <div className="terminal-window">
                <div className="terminal-line">
                  <span className="line-label">agent</span>
                  <span>collecting requirements...</span>
                </div>
                <div className="terminal-line">
                  <span className="line-label">agent</span>
                  <span>mapping dependencies...</span>
                </div>
                <div className="terminal-line">
                  <span className="line-label">agent</span>
                  <span>drafting actions...</span>
                </div>
                <div className="terminal-line success">
                  <span className="line-label">done</span>
                  <span>ready for approval</span>
                </div>
              </div>

              <div className="mini-grid">
                {highlights.map((item) => (
                  <div key={item.label} className="mini-stat">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-strip" id="features">
        <div className="feature-intro">
          <span>Why teams choose AgentFLUXA</span>
          <h2>One interface for planning, research, and execution.</h2>
        </div>

        <div className="feature-grid">
          {capabilities.map((item) => (
            <article key={item.title} className="feature-card">
              <div className="feature-icon">✦</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-panel" id="workflow">
        <div className="panel-heading">
          <span>Simple workflow</span>
          <h2>From intent to outcome in three guided steps.</h2>
        </div>

        <div className="step-grid">
          {steps.map((step) => (
            <div key={step.id} className="step-card">
              <span className="step-number">{step.id}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pricing-panel" id="plans">
        <div className="panel-heading">
          <span>Flexible access</span>
          <h2>Choose the right plan for your workflow.</h2>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`price-card ${plan.featured ? 'featured' : ''}`}
            >
              <h3>{plan.name}</h3>
              <div className="price-line">
                <span>{plan.price}</span>
              </div>
              <p>{plan.detail}</p>
              <button className={plan.featured ? 'primary-button small' : 'secondary-button small'}>
                {plan.featured ? 'Get started' : 'Learn more'}
              </button>
            </article>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} AgentFLUXA. Built for autonomous work.</p>
      </footer>
    </main>
  );
}
