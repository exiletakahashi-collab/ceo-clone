/**
 * LINE Messaging API Webhook
 */
const express = require('express');
const line = require('@line/bot-sdk');
const config = require('../config');
const db = require('../db');
const salesFlow = require('../clone/sales-flow');
const { getDefaultOwner } = require('../clone/persona');

const router = express.Router();

const lineConfig = {
  channelSecret: config.LINE_CHANNEL_SECRET,
  channelAccessToken: config.LINE_CHANNEL_ACCESS_TOKEN,
};

let lineClient = null;
function getClient() {
  if (!lineClient && config.LINE_CHANNEL_ACCESS_TOKEN && config.LINE_CHANNEL_ACCESS_TOKEN !== 'YOUR_NEW_CHANNEL_ACCESS_TOKEN') {
    lineClient = new line.messagingApi.MessagingApiClient({
      channelAccessToken: config.LINE_CHANNEL_ACCESS_TOKEN,
    });
  }
  return lineClient;
}

router.post('/webhook', (req, res, next) => {
  if (!config.LINE_CHANNEL_SECRET || config.LINE_CHANNEL_SECRET === 'YOUR_NEW_CHANNEL_SECRET') {
    return res.status(200).json({ message: 'LINE not configured' });
  }
  line.middleware(lineConfig)(req, res, next);
}, async (req, res) => {
  res.status(200).end();
  for (const event of (req.body.events || [])) {
    try { await handleEvent(event); } catch (err) { console.error('[LINE] Event error:', err.message); }
  }
});

async function handleEvent(event) {
  const client = getClient();
  if (!client) return;

  if (event.type === 'follow') return await handleFollow(event, client);
  if (event.type === 'message' && event.message.type === 'text') return await handleMessage(event, client);
}

async function handleFollow(event, client) {
  const userId = event.source.userId;
  let displayName = '';
  try { displayName = (await client.getProfile(userId)).displayName; } catch {}

  console.log(`[LINE] New follower: ${displayName} (${userId})`);

  const { owner, session } = salesFlow.createNewSession('line', userId, displayName);
  const welcome = salesFlow.generateWelcome(owner, session, displayName);
  await sendSplitMessages(client, userId, welcome);
}

async function handleMessage(event, client) {
  const userId = event.source.userId;
  const userMessage = event.message.text.trim();

  let displayName = '';
  try { displayName = (await client.getProfile(userId)).displayName; } catch {}

  console.log(`[LINE] ${displayName}(${userId}): ${userMessage.slice(0, 50)}...`);

  try {
    await client.replyMessage({ replyToken: event.replyToken, messages: [{ type: 'text', text: '考え中...' }] });
  } catch {}

  const { session, isNew } = salesFlow.getOrCreateLineSession(userId, displayName);

  let reply;
  if (isNew) {
    const owner = getDefaultOwner();
    reply = salesFlow.generateWelcome(owner, session, displayName);
  } else {
    reply = await salesFlow.processFlowStep(session, userMessage);
  }

  if (reply) {
    await sendSplitMessages(client, userId, reply);
    console.log(`[LINE] AI -> ${userId}: ${reply.slice(0, 50)}...`);
  }
}

async function sendSplitMessages(client, userId, text) {
  const parts = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= 4500) { parts.push(remaining); break; }
    let splitAt = remaining.lastIndexOf('\n', 4500);
    if (splitAt <= 0) splitAt = 4500;
    parts.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  for (const msg of parts.slice(0, 5)) {
    await client.pushMessage({ to: userId, messages: [{ type: 'text', text: msg }] });
  }
}

module.exports = router;
