/**
 * Web版チャットAPI
 */
const express = require('express');
const db = require('../db');
const salesFlow = require('../clone/sales-flow');
const { getDefaultOwner } = require('../clone/persona');

const router = express.Router();

router.post('/start', async (req, res) => {
  try {
    const owner = getDefaultOwner();
    if (!owner) return res.status(500).json({ error: 'Owner not configured. Run: npm run seed' });

    const { session } = salesFlow.createWebSession();
    const welcome = salesFlow.generateWelcome(owner, session, null);

    res.json({ sessionId: session.id, messages: [{ role: 'assistant', content: welcome }] });
  } catch (err) {
    console.error('[WebChat] Start error:', err.message);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

router.post('/message', async (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message) return res.status(400).json({ error: 'sessionId and message required' });

  try {
    const session = db.getSessionById.get(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const reply = await salesFlow.processFlowStep(session, message);
    const updated = db.getSessionById.get(sessionId);

    res.json({ reply, flowStep: updated.flow_step });
  } catch (err) {
    console.error('[WebChat] Message error:', err.message);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

router.get('/history/:sessionId', (req, res) => {
  try {
    const messages = db.getMessagesBySession.all(req.params.sessionId);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
