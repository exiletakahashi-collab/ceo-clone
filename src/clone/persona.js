/**
 * ペルソナ管理
 */
const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const db = require('../db');

const anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

const INTERVIEW_QUESTIONS = [
  { id: 1, q: 'お名前と会社名を教えてください。' },
  { id: 2, q: '御社の事業内容を一言で教えてください。' },
  { id: 3, q: '営業で一番大切にしていることは？' },
  { id: 4, q: 'お客様によく言われる自分の強みは？' },
  { id: 5, q: '営業で絶対にやらないことは？' },
  { id: 6, q: '話し方の特徴は？（方言、口癖など）' },
  { id: 7, q: 'よく使うフレーズや口癖は？' },
  { id: 8, q: 'お客様からの相談で一番多いのは？' },
  { id: 9, q: '成功事例を一つ教えてください。' },
  { id: 10, q: 'AIクローンに絶対守ってほしいルールは？' },
];

async function generatePersonaFromAnswers(answers) {
  const answersText = answers
    .map((a) => `Q: ${INTERVIEW_QUESTIONS[a.questionId - 1]?.q || a.question}\nA: ${a.answer}`)
    .join('\n\n');

  const response = await anthropic.messages.create({
    model: config.AI_MODEL,
    max_tokens: 2000,
    system: `あなたはAIペルソナ設計の専門家です。
以下のインタビュー回答から、この人物のAIクローン用「システムプロンプト」を生成してください。
第一人称で書き、LINEメッセージとして自然な長さで応答するよう指示を含めてください。`,
    messages: [{
      role: 'user',
      content: `以下のインタビュー回答から、この社長のAIクローン用システムプロンプトを生成してください。\n\n${answersText}`,
    }],
  });

  return response.content[0].text;
}

function getDefaultOwner() {
  return db.getFirstOwner.get();
}

function getOwnerPersona(ownerId) {
  const owner = db.getOwnerById.get(ownerId);
  return owner?.persona || null;
}

module.exports = { INTERVIEW_QUESTIONS, generatePersonaFromAnswers, getDefaultOwner, getOwnerPersona };
