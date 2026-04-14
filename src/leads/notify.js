/**
 * ホットリード通知
 * スコア70以上のリードを管理者のLINEに即通知
 */
const line = require('@line/bot-sdk');
const config = require('../config');
const scoring = require('./scoring');

let lineClient = null;

function getLineClient() {
  if (!lineClient && config.LINE_CHANNEL_ACCESS_TOKEN) {
    lineClient = new line.messagingApi.MessagingApiClient({
      channelAccessToken: config.LINE_CHANNEL_ACCESS_TOKEN,
    });
  }
  return lineClient;
}

/**
 * ホットリードを管理者に通知
 */
async function notifyHotLead(owner, lead) {
  const adminId = config.ADMIN_LINE_USER_ID || owner.lineUserId;
  if (!adminId) {
    console.log('[NOTIFY] Admin LINE ID not configured, skipping notification');
    return;
  }

  const client = getLineClient();
  if (!client) {
    console.log('[NOTIFY] LINE client not configured, skipping notification');
    return;
  }

  const label = scoring.getScoreLabel(lead.score);
  const msg = `🔥 ホットリード検出！

【${label}】スコア: ${lead.score}/100
名前: ${lead.displayName || '未取得'}
会社: ${lead.company || '未取得'}
業種: ${lead.industry || '未取得'}
課題: ${lead.painPoints || '未取得'}
規模: ${lead.employees || '未取得'}
チャネル: ${lead.channel === 'line' ? 'LINE' : 'Web'}

💡 早めのフォローが効果的です！`;

  try {
    await client.pushMessage({
      to: adminId,
      messages: [{ type: 'text', text: msg }],
    });
    console.log(`[NOTIFY] Hot lead notification sent to ${adminId}`);
  } catch (err) {
    console.error('[NOTIFY] Failed to send notification:', err.message);
  }
}

module.exports = { notifyHotLead };
