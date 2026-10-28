import { createClient, type Client } from "@libsql/client";

// 既存「プラットフォーム」と同じ Turso DB を使う。環境変数名は旧サイトと新しい命名の両方に対応。
let client: Client | undefined;
export function db(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL (または TURSO_DATABASE_URL) が設定されていません。");
  client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN,
  });
  return client;
}

// 掲示板用の表は既存の会員表と衝突しない名前で追加する（既存の表は変更しない）。
let ready: Promise<void> | undefined;
export function ensureBoardTables(): Promise<void> {
  ready ??= db()
    .batch(
      [
        `CREATE TABLE IF NOT EXISTS sc_posts (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          author TEXT NOT NULL,
          category TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS sc_replies (
          id TEXT PRIMARY KEY NOT NULL,
          post_id TEXT NOT NULL REFERENCES sc_posts(id),
          user_id TEXT NOT NULL,
          author TEXT NOT NULL,
          body TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS sc_posts_created_at ON sc_posts(created_at)`,
        `CREATE INDEX IF NOT EXISTS sc_replies_post_id ON sc_replies(post_id)`,
      ],
      "write",
    )
    .then(() => undefined)
    .catch((e) => {
      ready = undefined;
      throw e;
    });
  return ready;
}
