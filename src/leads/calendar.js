/**
 * Google Calendar連携（Phase 4で本格実装）
 *
 * 現在は仮実装: 空き枠の手動案内
 * 将来: Google Calendar APIで空き枠自動取得 → 予約確定
 */

/**
 * 空き枠テキストを生成（仮実装）
 */
function getAvailabilityText() {
  const now = new Date();
  const nextWeek = [];

  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    if (d.getDay() >= 1 && d.getDay() <= 5) {
      // 平日のみ
      nextWeek.push(
        `${d.getMonth() + 1}/${d.getDate()}(${['日', '月', '火', '水', '木', '金', '土'][d.getDay()]})`
      );
    }
  }

  return nextWeek.slice(0, 3).map((d) => `${d} 10:00〜 / 14:00〜 / 16:00〜`).join('\n');
}

module.exports = { getAvailabilityText };
