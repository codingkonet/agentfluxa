import { useEffect, useState } from 'react';

const TOOL_CARDS = [
  { id: 'budget', title: 'Budget Manager', description: 'Track a monthly limit and expenses in one place.' },
  { id: 'prompt', title: 'Prompt Library', description: 'Save reusable prompts for coding, research, and planning.', soon: true },
  { id: 'notes', title: 'Quick Notes', description: 'Keep lightweight notes beside your AI sessions.', soon: true },
];

const STORAGE_KEY = 'agentfluxa_budget';

function loadBudget() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { limit: 0, expenses: [] };
  } catch {
    return { limit: 0, expenses: [] };
  }
}

export default function Tools() {
  const [activeTool, setActiveTool] = useState('budget');
  const [budget, setBudget] = useState(loadBudget);
  const [limitInput, setLimitInput] = useState(String(budget.limit || ''));
  const [expense, setExpense] = useState({ name: '', amount: '' });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
  }, [budget]);

  const spent = budget.expenses.reduce((total, item) => total + item.amount, 0);
  const remaining = Math.max(0, budget.limit - spent);
  const progress = budget.limit > 0 ? Math.min(100, (spent / budget.limit) * 100) : 0;

  function saveLimit(e) {
    e.preventDefault();
    const limit = Number(limitInput);
    if (Number.isFinite(limit) && limit >= 0) setBudget((current) => ({ ...current, limit }));
  }

  function addExpense(e) {
    e.preventDefault();
    const amount = Number(expense.amount);
    if (!expense.name.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setBudget((current) => ({
      ...current,
      expenses: [{ id: crypto.randomUUID(), name: expense.name.trim(), amount }, ...current.expenses],
    }));
    setExpense({ name: '', amount: '' });
  }

  function removeExpense(id) {
    setBudget((current) => ({
      ...current,
      expenses: current.expenses.filter((item) => item.id !== id),
    }));
  }

  return (
    <main className="tools-page">
      <section className="tools-intro">
        <p className="auth-kicker">WORKSPACE TOOLS</p>
        <h2>Useful tools, one workspace.</h2>
        <p>Small utilities that keep your AI work organized and moving.</p>
      </section>

      <div className="tools-layout">
        <aside className="tool-list" aria-label="Tools">
          {TOOL_CARDS.map((tool) => (
            <button
              key={tool.id}
              className={`tool-list-item ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => !tool.soon && setActiveTool(tool.id)}
              disabled={tool.soon}
            >
              <span>{tool.title}</span>
              {tool.soon && <small>Soon</small>}
            </button>
          ))}
        </aside>

        {activeTool === 'budget' && (
          <section className="budget-panel">
            <div className="tool-panel-header">
              <div>
                <p className="auth-kicker">PERSONAL FINANCE</p>
                <h3>Budget Manager</h3>
              </div>
              <span className={remaining > 0 ? 'budget-status' : 'budget-status danger'}>
                {budget.limit ? `${Math.round(progress)}% used` : 'Set a limit'}
              </span>
            </div>

            <form className="budget-limit-form" onSubmit={saveLimit}>
              <label className="field">
                <span>Monthly budget</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  placeholder="0.00"
                />
              </label>
              <button type="submit">Save limit</button>
            </form>

            <div className="budget-summary">
              <div><span>Spent</span><strong>${spent.toFixed(2)}</strong></div>
              <div><span>Remaining</span><strong>${remaining.toFixed(2)}</strong></div>
            </div>
            <div className="budget-progress" aria-label={`${Math.round(progress)} percent of budget used`}>
              <span style={{ width: `${progress}%` }} />
            </div>

            <form className="expense-form" onSubmit={addExpense}>
              <label className="field">
                <span>Expense</span>
                <input
                  value={expense.name}
                  onChange={(e) => setExpense({ ...expense, name: e.target.value })}
                  placeholder="e.g. API credits"
                />
              </label>
              <label className="field amount-field">
                <span>Amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={expense.amount}
                  onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
                  placeholder="0.00"
                />
              </label>
              <button type="submit">Add expense</button>
            </form>

            <div className="expense-list">
              {budget.expenses.length === 0 ? (
                <p className="muted">No expenses added yet.</p>
              ) : budget.expenses.map((item) => (
                <div className="expense-row" key={item.id}>
                  <span>{item.name}</span>
                  <strong>${item.amount.toFixed(2)}</strong>
                  <button onClick={() => removeExpense(item.id)} aria-label={`Remove ${item.name}`}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
