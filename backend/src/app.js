import express from 'express';
const app = express(); app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'dsa-grind-api' }));
app.get('/api/progress', (_req, res) => res.json({ completedWeeks: [], completedCheckpoints: [], persistence: 'not-configured' }));
app.listen(process.env.PORT || 3001, () => console.log('DSA Grind API listening on port 3001'));
