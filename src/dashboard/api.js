/**
 * 管理ダッシュボードAPI
 */
const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/stats', (req, res) => {
  try {
    const totalLeads = db.countLeads.get().count;
    const hotLeads = db.countHotLeads.get().count;
    const totalSessions = db.countSessions.get().count;
    const totalMessages = db.countMessages.get().count;
    const appointments = db.countAppointments.get().count;
    const lineLeads = db.countLeadsByChannel.get('line').count;
    const webLeads = db.countLeadsByChannel.get('web').count;
    const todayLeads = db.countTodayLeads.get().count;

    const statusRows = db.getLeadStatusCounts.all();
    const statusCounts = Object.fromEntries(statusRows.map((s) => [s.status, s.count]));

    res.json({ totalLeads, hotLeads, totalSessions, totalMessages, appointments, lineLeads, webLeads, todayLeads, statusCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leads', (req, res) => {
  try {
    const leads = db.getAllLeads.all();
    res.json({ leads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leads/:id', (req, res) => {
  try {
    const lead = db.getLeadById.get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // セッション + メッセージ取得
    const sessions = db.db.prepare('SELECT * FROM chat_sessions WHERE lead_id = ? ORDER BY created_at ASC').all(lead.id);
    for (const s of sessions) {
      s.messages = db.getMessagesBySession.all(s.id);
    }
    lead.sessions = sessions;

    res.json({ lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/owner', (req, res) => {
  try {
    const owner = db.getFirstOwner.get();
    if (!owner) return res.status(404).json({ error: 'Owner not configured' });
    res.json({ owner: { ...owner, persona: owner.persona.slice(0, 200) + '...' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
