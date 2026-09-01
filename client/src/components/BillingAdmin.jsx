import { useEffect, useState } from 'react';

const ADMIN_EMAIL = 'dev@agentfluxa.com';

export default function BillingAdmin({ token, userEmail }) {
  const authHeaders = { Authorization: `Bearer ${token}` };
  const [billing, setBilling] = useState(null);
  const [planDrafts, setPlanDrafts] = useState({});
  const [paypalDraft, setPaypalDraft] = useState({});
  const [status, setStatus] = useState({});
  const [error, setError] = useState('');

  const isAdmin = String(userEmail || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

  async function refresh() {
    try {
      const res = await fetch('/api/billing', { headers: authHeaders });
      const data = await res.json();
      setBilling(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function updatePlanDraft(planId, field, value) {
    setPlanDrafts((prev) => ({ ...prev, [planId]: { ...prev[planId], [field]: value } }));
  }

  async function savePlan(planId) {
    setStatus((s) => ({ ...s, [planId]: 'saving' }));
    try {
      const draft = planDrafts[planId] || {};
      const payload = { ...draft };
      if (typeof draft.features === 'string') {
        payload.features = draft.features.split('\n');
      }
      const res = await fetch(`/api/billing/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save plan');
      setBilling(data);
      setPlanDrafts((prev) => ({ ...prev, [planId]: {} }));
      setStatus((s) => ({ ...s, [planId]: 'saved' }));
    } catch (err) {
      setStatus((s) => ({ ...s, [planId]: 'error' }));
      setError(err.message);
    }
  }

  async function togglePlan(planId, enabled) {
    setStatus((s) => ({ ...s, [planId]: 'saving' }));
    try {
      const res = await fetch(`/api/billing/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update plan');
      setBilling(data);
      setStatus((s) => ({ ...s, [planId]: 'saved' }));
    } catch (err) {
      setStatus((s) => ({ ...s, [planId]: 'error' }));
      setError(err.message);
    }
  }

  async function savePaypal() {
    setStatus((s) => ({ ...s, paypal: 'saving' }));
    try {
      const res = await fetch('/api/billing/paypal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(paypalDraft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save PayPal settings');
      setBilling(data);
      setPaypalDraft({});
      setStatus((s) => ({ ...s, paypal: 'saved' }));
    } catch (err) {
      setStatus((s) => ({ ...s, paypal: 'error' }));
      setError(err.message);
    }
  }

  async function clearPaypal() {
    setStatus((s) => ({ ...s, paypal: 'saving' }));
    try {
      const res = await fetch('/api/billing/paypal', { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      setBilling(data);
      setStatus((s) => ({ ...s, paypal: 'cleared' }));
    } catch (err) {
      setStatus((s) => ({ ...s, paypal: 'error' }));
      setError(err.message);
    }
  }

  if (!billing) return <div className="dashboard">Loading…</div>;

  if (!isAdmin) {
    return (
      <div className="dashboard">
        <p className="dashboard-note">Admin access is restricted to {ADMIN_EMAIL}.</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="admin-shell">
        <div className="admin-header">
          <div>
            <p className="eyebrow">Admin panel</p>
            <h2>Payments and plans</h2>
          </div>
          <div className="admin-metrics">
            <button className="secondary" onClick={refresh}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && <div className="bubble error">{error}</div>}

      {['free', 'paid'].map((planId) => {
        const plan = billing.plans[planId];
        const draft = planDrafts[planId] || {};
        return (
          <section key={planId} className="provider-card">
            <div className="provider-card-header">
              <h3>{plan.name} plan</h3>
              <span className={`badge ${plan.enabled ? 'ok' : 'off'}`}>
                {plan.enabled ? 'enabled' : 'disabled'}
              </span>
            </div>

            <label className="field">
              <span>Plan name</span>
              <input
                type="text"
                placeholder={plan.name}
                value={draft.name ?? ''}
                onChange={(e) => updatePlanDraft(planId, 'name', e.target.value)}
              />
            </label>
            <label className="field">
              <span>Price</span>
              <input
                type="text"
                placeholder={plan.price}
                value={draft.price ?? ''}
                onChange={(e) => updatePlanDraft(planId, 'price', e.target.value)}
              />
            </label>
            <label className="field">
              <span>Description</span>
              <input
                type="text"
                placeholder={plan.detail}
                value={draft.detail ?? ''}
                onChange={(e) => updatePlanDraft(planId, 'detail', e.target.value)}
              />
            </label>
            <label className="field">
              <span>Features (one per line)</span>
              <textarea
                rows={4}
                placeholder={plan.features.join('\n')}
                value={draft.features ?? ''}
                onChange={(e) => updatePlanDraft(planId, 'features', e.target.value)}
              />
            </label>

            <div className="provider-card-actions">
              <button onClick={() => savePlan(planId)}>Save</button>
              <button className="secondary" onClick={() => togglePlan(planId, !plan.enabled)}>
                {plan.enabled ? 'Disable plan' : 'Enable plan'}
              </button>
              {status[planId] === 'saved' && <span className="status ok">Saved</span>}
              {status[planId] === 'error' && <span className="status error">Error</span>}
            </div>
          </section>
        );
      })}

      <section className="provider-card">
        <div className="provider-card-header">
          <h3>PayPal payment method</h3>
          <span className={`badge ${billing.paypal.configured ? 'ok' : 'off'}`}>
            {billing.paypal.configured ? 'configured' : 'not set'}
          </span>
        </div>

        <label className="field">
          <span>PayPal account email</span>
          <input
            type="email"
            placeholder={billing.paypal.email || 'billing@example.com'}
            value={paypalDraft.email ?? ''}
            onChange={(e) => setPaypalDraft((p) => ({ ...p, email: e.target.value }))}
          />
        </label>
        <label className="field">
          <span>PayPal API key {billing.paypal.apiKeyMasked && `(current: ${billing.paypal.apiKeyMasked})`}</span>
          <input
            type="password"
            placeholder="Paste PayPal API key…"
            value={paypalDraft.apiKey ?? ''}
            onChange={(e) => setPaypalDraft((p) => ({ ...p, apiKey: e.target.value }))}
          />
        </label>

        <div className="provider-card-actions">
          <button onClick={savePaypal}>Save</button>
          <button className="secondary" onClick={clearPaypal}>
            Clear
          </button>
          {status.paypal === 'saved' && <span className="status ok">Saved</span>}
          {status.paypal === 'cleared' && <span className="status">Cleared</span>}
          {status.paypal === 'error' && <span className="status error">Error</span>}
        </div>
      </section>
    </div>
  );
}
