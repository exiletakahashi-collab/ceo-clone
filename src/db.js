/**
 * 社長AIクローン - データベース (better-sqlite3)
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '..', 'data', 'ceo-clone.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// テーブル作成
db.exec(`
  CREATE TABLE IF NOT EXISTS owners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    persona TEXT NOT NULL,
    line_user_id TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    line_user_id TEXT,
    display_name TEXT,
    company TEXT,
    industry TEXT,
    employees TEXT,
    pain_points TEXT,
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (owner_id) REFERENCES owners(id)
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    lead_id TEXT,
    channel TEXT NOT NULL,
    flow_step TEXT DEFAULT 'welcome',
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (owner_id) REFERENCES owners(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    datetime TEXT NOT NULL,
    google_event_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  );

  CREATE INDEX IF NOT EXISTS idx_leads_owner_status ON leads(owner_id, status);
  CREATE INDEX IF NOT EXISTS idx_leads_line_user ON leads(line_user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_owner ON chat_sessions(owner_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_lead ON chat_sessions(lead_id);
  CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
`);

// === Prepared Statements ===

// Owners
const getFirstOwner = db.prepare('SELECT * FROM owners ORDER BY created_at ASC LIMIT 1');
const getOwnerById = db.prepare('SELECT * FROM owners WHERE id = ?');
const upsertOwner = db.prepare(`
  INSERT INTO owners (id, name, company, persona) VALUES (?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET persona = excluded.persona, updated_at = datetime('now','localtime')
`);

// Leads
const createLead = db.prepare(`
  INSERT INTO leads (id, owner_id, channel, line_user_id, display_name, status)
  VALUES (?, ?, ?, ?, ?, 'new')
`);
const getLeadByLineUser = db.prepare(
  'SELECT * FROM leads WHERE line_user_id = ? ORDER BY created_at DESC LIMIT 1'
);
const getLeadById = db.prepare('SELECT * FROM leads WHERE id = ?');
const updateLeadField = db.prepare(`
  UPDATE leads SET industry = COALESCE(?, industry), pain_points = COALESCE(?, pain_points),
  employees = COALESCE(?, employees), company = COALESCE(?, company),
  score = COALESCE(?, score), status = COALESCE(?, status),
  updated_at = datetime('now','localtime') WHERE id = ?
`);
const getAllLeads = db.prepare('SELECT * FROM leads ORDER BY score DESC, updated_at DESC LIMIT 100');
const countLeads = db.prepare('SELECT COUNT(*) as count FROM leads');
const countHotLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE score >= 70");
const countLeadsByChannel = db.prepare('SELECT COUNT(*) as count FROM leads WHERE channel = ?');
const countTodayLeads = db.prepare(
  "SELECT COUNT(*) as count FROM leads WHERE created_at >= date('now','localtime')"
);
const getLeadStatusCounts = db.prepare(
  'SELECT status, COUNT(*) as count FROM leads GROUP BY status'
);

// Sessions
const createSession = db.prepare(`
  INSERT INTO chat_sessions (id, owner_id, lead_id, channel, flow_step) VALUES (?, ?, ?, ?, 'welcome')
`);
const getSessionById = db.prepare('SELECT * FROM chat_sessions WHERE id = ?');
const getSessionByLead = db.prepare(
  'SELECT * FROM chat_sessions WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1'
);
const updateSessionStep = db.prepare(`
  UPDATE chat_sessions SET flow_step = ?, metadata = COALESCE(?, metadata),
  updated_at = datetime('now','localtime') WHERE id = ?
`);
const countSessions = db.prepare('SELECT COUNT(*) as count FROM chat_sessions');

// Messages
const addMessage = db.prepare('INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)');
const getRecentMessages = db.prepare(
  'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?'
);
const getMessagesBySession = db.prepare(
  'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC'
);
const countMessages = db.prepare('SELECT COUNT(*) as count FROM messages');

// Appointments
const countAppointments = db.prepare('SELECT COUNT(*) as count FROM appointments');

// === Helper Functions ===
function genId() {
  return uuidv4().replace(/-/g, '').slice(0, 25);
}

module.exports = {
  db,
  genId,
  // owners
  getFirstOwner,
  getOwnerById,
  upsertOwner,
  // leads
  createLead,
  getLeadByLineUser,
  getLeadById,
  updateLeadField,
  getAllLeads,
  countLeads,
  countHotLeads,
  countLeadsByChannel,
  countTodayLeads,
  getLeadStatusCounts,
  // sessions
  createSession,
  getSessionById,
  getSessionByLead,
  updateSessionStep,
  countSessions,
  // messages
  addMessage,
  getRecentMessages,
  getMessagesBySession,
  countMessages,
  // appointments
  countAppointments,
};
