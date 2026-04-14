/**
 * リードスコアリング
 *
 * 見込み客の情報からスコア(0-100)を算出
 * スコアが高いほどホットリード
 */

// 高スコアの業種（クイヒラリのターゲット）
const HIGH_VALUE_INDUSTRIES = [
  'SNS', '運用代行', 'Web', 'IT', '広告', 'コンサル', '人材',
  '不動産', '保険', '建設', '製造',
];

const MEDIUM_VALUE_INDUSTRIES = [
  '美容室', '整骨院', '整体', '歯科', 'エステ', 'ネイル', '脱毛',
  '飲食', 'カフェ', 'レストラン',
];

// 深刻な課題キーワード
const HIGH_PAIN_KEYWORDS = [
  '取れない', '伸びない', '減っている', '困って', '限界',
  '人手不足', '育たない', '辞める', '赤字', '下がっ',
];

const MEDIUM_PAIN_KEYWORDS = [
  '増やしたい', '改善', '効率', '自動化', '時間がない',
  'やり方がわからない', 'もっと',
];

/**
 * リード情報からスコアを算出
 * @param {object} lead - { industry, painPoints, employees, ... }
 * @returns {number} 0-100のスコア
 */
function calculateScore(lead) {
  let score = 10; // ベーススコア（友達追加しただけで10点）

  // 業種スコア (0-30)
  if (lead.industry) {
    const ind = lead.industry;
    if (HIGH_VALUE_INDUSTRIES.some((k) => ind.includes(k))) {
      score += 30;
    } else if (MEDIUM_VALUE_INDUSTRIES.some((k) => ind.includes(k))) {
      score += 20;
    } else {
      score += 10;
    }
  }

  // 課題深刻度スコア (0-30)
  if (lead.painPoints) {
    const pain = lead.painPoints;
    if (HIGH_PAIN_KEYWORDS.some((k) => pain.includes(k))) {
      score += 30;
    } else if (MEDIUM_PAIN_KEYWORDS.some((k) => pain.includes(k))) {
      score += 20;
    } else {
      score += 10;
    }
  }

  // 規模スコア (0-20)
  if (lead.employees) {
    const numMatch = lead.employees.match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      if (num >= 10 && num <= 100) score += 20; // 中規模が最適
      else if (num >= 3) score += 15;
      else score += 5;
    } else {
      score += 10;
    }
  }

  // ヒアリング完了ボーナス (10)
  if (lead.industry && lead.painPoints && lead.employees) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * スコアからステータスラベルを取得
 */
function getScoreLabel(score) {
  if (score >= 80) return 'HOT';
  if (score >= 60) return 'WARM';
  if (score >= 30) return 'COOL';
  return 'COLD';
}

module.exports = { calculateScore, getScoreLabel };
