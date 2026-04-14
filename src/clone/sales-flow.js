/**
 * 自動営業フロー
 *
 * welcome → hearing_1(業種) → hearing_2(課題) → hearing_3(規模)
 * → proposal(パーソナライズ提案) → qa(質問応答) → appointment(アポ取得)
 */
const db = require('../db');
const { generateCloneResponse } = require('./responder');
const { getDefaultOwner } = require('./persona');
const scoring = require('../leads/scoring');

const HEARING_STEPS = {
  hearing_1: {
    question: 'ちなみに、どんなお仕事されてますか？業種を教えてもらえると、もっと具体的な話ができます！',
    field: 'industry',
  },
  hearing_2: {
    question: 'ありがとうございます！今、営業やビジネスで一番困ってることって何ですか？\n\n例えば:\n・新規のお客さんが取れない\n・営業マンが育たない\n・単価が上がらない\n・時間が足りない\n\n何でもOKです！',
    field: 'pain_points',
  },
  hearing_3: {
    question: '最後にもう一つ！会社の規模感を教えてください。（従業員数とか）',
    field: 'employees',
  },
};

function createNewSession(channel, lineUserId, displayName) {
  const owner = getDefaultOwner();
  if (!owner) throw new Error('Owner not configured. Run: npm run seed');

  const leadId = db.genId();
  db.createLead.run(leadId, owner.id, channel, channel === 'line' ? lineUserId : null, displayName || null);
  const lead = db.getLeadById.get(leadId);

  const sessionId = db.genId();
  db.createSession.run(sessionId, owner.id, leadId, channel);
  const session = db.getSessionById.get(sessionId);

  return { owner, lead, session };
}

function generateWelcome(owner, session, displayName) {
  const nameGreet = displayName ? `${displayName}さん、` : '';
  const welcomeMsg = `${nameGreet}はじめまして！${owner.name}です。

${owner.company}の代表をやってます。
友だち追加ありがとうございます！

僕は中小企業の営業を強くする「法人営業顧問」をやってます。
今まで色んな会社さんの営業をお手伝いしてきたんですが、
LINEでも気軽に相談してもらえたらなと思って、このアカウント作りました。

まず3つだけ質問させてください。
あなたに合った話ができるようにしたいので！`;

  db.addMessage.run(db.genId(), session.id, 'assistant', welcomeMsg);

  // ステップを hearing_1 に進める
  db.updateSessionStep.run('hearing_1', null, session.id);

  const firstQ = HEARING_STEPS.hearing_1.question;
  db.addMessage.run(db.genId(), session.id, 'assistant', firstQ);

  return welcomeMsg + '\n\n' + firstQ;
}

async function processFlowStep(session, userMessage) {
  const owner = db.getOwnerById.get(session.owner_id);
  if (!owner) throw new Error('Owner not found');

  let lead = session.lead_id ? db.getLeadById.get(session.lead_id) : null;
  const step = session.flow_step;

  if (step.startsWith('hearing_')) {
    return await handleHearingStep(session, lead, owner, userMessage, step);
  }

  if (step === 'proposal' || step === 'qa' || step === 'appointment') {
    return await handleQAStep(session, lead, owner, userMessage);
  }

  if (step === 'welcome') {
    db.updateSessionStep.run('hearing_1', null, session.id);
    const firstQ = HEARING_STEPS.hearing_1.question;
    return await generateCloneResponse(session.id, userMessage, {
      persona: owner.persona,
      flowContext: `【指示】ユーザーが話しかけてきました。まず挨拶して、その後以下の質問をしてください：\n${firstQ}`,
    });
  }

  return null;
}

async function handleHearingStep(session, lead, owner, userMessage, step) {
  const hearingDef = HEARING_STEPS[step];
  if (!hearingDef) return null;

  // 回答をリード情報に保存
  if (lead) {
    const updates = { industry: null, pain_points: null, employees: null, company: null, score: null, status: 'hearing' };
    updates[hearingDef.field] = userMessage;
    db.updateLeadField.run(updates.industry, updates.pain_points, updates.employees, updates.company, updates.score, updates.status, lead.id);
    lead = db.getLeadById.get(lead.id);
  }

  // メタデータに回答を蓄積
  let metadata = {};
  try { metadata = session.metadata ? JSON.parse(session.metadata) : {}; } catch {}
  metadata[step] = userMessage;

  const stepNum = parseInt(step.split('_')[1]);
  const nextStep = stepNum < 3 ? `hearing_${stepNum + 1}` : 'proposal';
  db.updateSessionStep.run(nextStep, JSON.stringify(metadata), session.id);

  if (nextStep.startsWith('hearing_')) {
    const nextQ = HEARING_STEPS[nextStep].question;
    return await generateCloneResponse(session.id, userMessage, {
      persona: owner.persona,
      leadInfo: lead,
      flowContext: `【指示】ユーザーが「${hearingDef.field}」について「${userMessage}」と回答しました。
まず回答に対してリアクション（共感・コメント）を短く返し、その後以下の質問をしてください：
${nextQ}

【重要】質問は必ず含めること。リアクションは2行以内で。`,
    });
  }

  // 全ヒアリング完了 → 提案生成
  return await generateProposal(session, lead, owner, metadata);
}

async function generateProposal(session, lead, owner, metadata) {
  if (lead) {
    const score = scoring.calculateScore(lead);
    const status = score >= 70 ? 'hot' : 'engaged';
    db.updateLeadField.run(null, null, null, null, score, status, lead.id);
    lead = db.getLeadById.get(lead.id);
  }

  const proposalContext = `【指示: パーソナライズ提案モード】
ヒアリングが完了しました。

【ヒアリング結果】
- 業種: ${lead?.industry || '不明'}
- 課題: ${lead?.pain_points || '不明'}
- 規模: ${lead?.employees || '不明'}

【提案のルール】
1. まず相手の課題に共感する（1-2行）
2. うちならこう解決できるという具体的な提案（3-5行）
3. 似た業種の成功事例があれば簡潔に紹介（2-3行）
4. 最後に「もっと詳しく話しましょうか？」とアポへの導線

【重要】
- 売り込み感を出さない
- 「御社のケースだと」と個別感を出す
- 具体的な数字を入れる
- 300字以内`;

  const reply = await generateCloneResponse(session.id, '（ヒアリング完了・提案お願いします）', {
    persona: owner.persona,
    leadInfo: lead,
    flowContext: proposalContext,
  });

  if (lead && lead.score >= 70) {
    const notify = require('../leads/notify');
    notify.notifyHotLead(owner, lead);
  }

  return reply;
}

async function handleQAStep(session, lead, owner, userMessage) {
  if (/詳しく|話したい|相談したい|会いたい|アポ|予約|日程/.test(userMessage)) {
    db.updateSessionStep.run('appointment', null, session.id);

    if (lead) {
      db.updateLeadField.run(null, null, null, null, Math.max(lead.score, 80), 'hot', lead.id);
    }

    return await generateCloneResponse(session.id, userMessage, {
      persona: owner.persona,
      leadInfo: lead,
      flowContext: `【指示: アポイント取得モード】
見込み客がアポを希望しています！
1. 「嬉しいです！ぜひ話しましょう」と喜ぶ
2. 「来週あたりで都合のいい日時はありますか？」と聞く
3. 「30分くらいZoomかお電話で大丈夫です」と伝える
4. 「お名前と連絡先を教えてもらえますか？」`,
    });
  }

  return await generateCloneResponse(session.id, userMessage, {
    persona: owner.persona,
    leadInfo: lead,
    flowContext: `【指示: 質問応答モード】
見込み客からの質問に営業のプロとして回答してください。
ヒアリング結果を踏まえて個別具体的に。
3回に1回くらい「もっと詳しく話しましょうか？」を入れてください。`,
  });
}

function getOrCreateLineSession(lineUserId, displayName) {
  const existingLead = db.getLeadByLineUser.get(lineUserId);

  if (existingLead) {
    const existingSession = db.getSessionByLead.get(existingLead.id);
    if (existingSession) {
      return { session: existingSession, lead: existingLead, isNew: false };
    }
  }

  const { owner, lead, session } = createNewSession('line', lineUserId, displayName);
  return { session, lead, owner, isNew: true };
}

function createWebSession() {
  return createNewSession('web', null, null);
}

module.exports = {
  createNewSession,
  generateWelcome,
  processFlowStep,
  getOrCreateLineSession,
  createWebSession,
  HEARING_STEPS,
};
