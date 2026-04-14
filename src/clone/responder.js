/**
 * クローン応答エンジン
 */
const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const db = require('../db');

const anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

async function generateCloneResponse(sessionId, userMessage, options = {}) {
  const { persona, leadInfo, flowContext } = options;

  // ユーザーメッセージをDBに保存
  db.addMessage.run(db.genId(), sessionId, 'user', userMessage);

  // 直近20件の会話履歴
  const recentMessages = db.getRecentMessages.all(sessionId, 20).reverse();
  const messages = recentMessages.map((m) => ({ role: m.role, content: m.content }));

  // システムプロンプト構築
  let system = persona || 'あなたは営業のプロフェッショナルです。';

  if (leadInfo) {
    const parts = [];
    if (leadInfo.company) parts.push(`会社名: ${leadInfo.company}`);
    if (leadInfo.industry) parts.push(`業種: ${leadInfo.industry}`);
    if (leadInfo.employees) parts.push(`従業員数: ${leadInfo.employees}`);
    if (leadInfo.pain_points) parts.push(`課題: ${leadInfo.pain_points}`);
    if (parts.length > 0) system += `\n\n【この見込み客の情報】\n${parts.join('\n')}`;
  }

  if (flowContext) system += `\n\n${flowContext}`;

  system += `\n\n【LINEでの応答ルール】
- 1メッセージ300字以内を目安
- 絵文字は使いすぎない（1-2個まで）
- 結論ファースト
- 相手の話をまず受け止めてから返す
- 営業っぽくなりすぎない、自然な会話を心がける`;

  let response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await anthropic.messages.create({
        model: config.AI_MODEL,
        max_tokens: 1500,
        system,
        messages,
      });
      break;
    } catch (err) {
      if (err.status === 529 && attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 3000));
      } else {
        throw err;
      }
    }
  }

  const reply = response.content[0].text;
  db.addMessage.run(db.genId(), sessionId, 'assistant', reply);
  return reply;
}

module.exports = { generateCloneResponse };
