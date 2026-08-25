import { Router } from 'express';
import {
  authenticate,
  createSession,
  createUser,
  getUserByToken,
  removeSession,
} from '../store/auth.js';

const router = Router();
const tokenFrom = (req) => req.get('authorization')?.replace(/^Bearer\s+/i, '');

router.post('/signup', async (req, res) => {
  try {
    const user = await createUser(req.body ?? {});
    const token = await createSession(user.id);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const user = await authenticate(req.body ?? {});
    const token = await createSession(user.id);
    res.json({ user, token });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  const user = await getUserByToken(tokenFrom(req));
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  res.json({ user });
});

router.post('/logout', async (req, res) => {
  await removeSession(tokenFrom(req));
  res.status(204).end();
});

export async function requireAuth(req, res, next) {
  const user = await getUserByToken(tokenFrom(req));
  if (!user) return res.status(401).json({ error: 'Please sign in to continue' });
  req.user = user;
  next();
}

export default router;
