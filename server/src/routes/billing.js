import { Router } from 'express';
import { getPublicBilling, savePlan, savePaypalConfig, clearPaypalConfig } from '../store/billing.js';

const ADMIN_EMAIL = 'dev@agentfluxa.com';
const router = Router();

export function requireAdmin(req, res, next) {
  if (String(req.user?.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: 'Admin access only' });
  }
  next();
}

router.get('/', requireAdmin, async (_req, res) => {
  res.json(await getPublicBilling());
});

router.get('/public', async (_req, res) => {
  res.json(await getPublicBilling());
});

router.put('/plans/:planId', requireAdmin, async (req, res) => {
  try {
    const billing = await savePlan(req.params.planId, req.body ?? {});
    res.json(billing);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/paypal', requireAdmin, async (req, res) => {
  try {
    const billing = await savePaypalConfig(req.body ?? {});
    res.json(billing);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/paypal', requireAdmin, async (_req, res) => {
  res.json(await clearPaypalConfig());
});

export default router;
