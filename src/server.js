/**
 * 社長AIクローン - メインサーバー
 * LINE Webhook + Web Chat API + Dashboard API
 */
const express = require('express');
const path = require('path');
const config = require('./config');

const app = express();

// JSON body parser（LINE webhook以外）
app.use((req, res, next) => {
  if (req.path === '/webhook') return next();
  express.json()(req, res, next);
});

// 静的ファイル（Web版フロントエンド）
app.use(express.static(path.join(__dirname, '..', 'web')));

// ヘルスチェック
app.get('/api/health', (req, res) => {
  const db = require('./db');
  try {
    const owners = db.db.prepare('SELECT COUNT(*) as count FROM owners').get().count;
    const leads = db.countLeads.get().count;
    res.json({
      service: '社長AIクローン',
      provider: '株式会社クイヒラリ',
      status: 'running',
      owners,
      leads,
      version: '1.0.0',
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// LINE Webhook
const lineWebhook = require('./channels/line-webhook');
app.use('/', lineWebhook);

// Web Chat API
const webChat = require('./channels/web-chat');
app.use('/api/chat', webChat);

// Dashboard API
const dashboard = require('./dashboard/api');
app.use('/api/dashboard', dashboard);

// フロントエンドルーティング
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'web', 'dashboard.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'web', 'index.html'));
});

// サーバー起動
app.listen(config.PORT, () => {
  console.log(`
\x1b[36m╔════════════════════════════════════════════════╗
║                                                ║
║   社長AIクローン  v1.0.0                       ║
║   CEO Clone - 24時間自動営業                    ║
║   by 株式会社クイヒラリ                          ║
║                                                ║
╚════════════════════════════════════════════════╝\x1b[0m

  Server:      http://localhost:${config.PORT}
  Health:      http://localhost:${config.PORT}/api/health
  Web Chat:    http://localhost:${config.PORT}/chat
  Dashboard:   http://localhost:${config.PORT}/dashboard
  LINE Hook:   http://localhost:${config.PORT}/webhook
`);
});
