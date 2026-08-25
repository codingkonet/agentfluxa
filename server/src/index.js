import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';
import settingsRouter from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 5174;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'AgentFLUXA' });
});

app.use('/api/chat', chatRouter);
app.use('/api/settings', settingsRouter);

app.listen(PORT, () => {
  console.log(`AgentFLUXA server listening on http://localhost:${PORT}`);
});
