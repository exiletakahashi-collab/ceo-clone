// 運営が扱う商材。ここを書き換えると /products に反映される。
// partner（紹介パートナーの名前）は月額会員にだけ表示する。
export type Product = { name: string; partner?: string };

// ストック商材（継続報酬）
export const STOCK_PRODUCTS: Product[] = [
  { name: "アドバイザリー契約" },
  { name: "Luna AI" },
  { name: "Luna Call" },
  { name: "AI Jam" },
  { name: "AIO" },
  { name: "ライフサポート" },
  { name: "社労士顧問紹介", partner: "浅井さん" },
  { name: "BPO" },
  { name: "経営管理" },
  { name: "採用代行", partner: "木村さん" },
  { name: "マーケティング", partner: "有木さん" },
  { name: "鹿肉ドッグフード" },
  { name: "オンラインサロン" },
];

// ショット商材（単発報酬）
export const SHOT_PRODUCTS: Product[] = [
  { name: "補助金" },
  { name: "セルフホワイトニング" },
  { name: "系統用蓄電池" },
];
