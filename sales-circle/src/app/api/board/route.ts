import { db, ensureBoardTables } from "@/lib/db";
import { getCurrentMember, isSameOrigin } from "@/lib/session";

const CATEGORIES = ["営業相談", "協業・紹介", "商材情報", "高橋に相談", "交流・雑談"];

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return Response.json({ error: "ログインしてください。" }, { status: 401 });
  try {
    await ensureBoardTables();
    const [posts, replies] = await db().batch(
      [
        "SELECT id, author, category, title, body, created_at AS createdAt FROM sc_posts ORDER BY created_at DESC",
        "SELECT id, post_id AS postId, author, body, created_at AS createdAt FROM sc_replies ORDER BY created_at",
      ],
      "read",
    );
    return Response.json(
      { posts: posts.rows, replies: replies.rows },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "掲示板を読み込めませんでした。再読み込みしてください。" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const member = await getCurrentMember();
  if (!member) return Response.json({ error: "ログインしてください。" }, { status: 401 });
  if (!isSameOrigin(req))
    return Response.json({ error: "アクセスを確認できません。" }, { status: 403 });
  try {
    const v = (await req.json()) as Record<string, unknown>;
    const author = typeof v.author === "string" ? v.author.trim() : "";
    const body = typeof v.body === "string" ? v.body.trim() : "";
    if (!author || author.length > 40 || !body || body.length > 5000)
      return Response.json(
        { error: "表示名と本文を入力してください。本文は5000文字以内です。" },
        { status: 400 },
      );
    await ensureBoardTables();
    const id = crypto.randomUUID();
    const now = Date.now();
    if (typeof v.postId === "string") {
      const found = await db().execute({ sql: "SELECT 1 FROM sc_posts WHERE id = ?", args: [v.postId] });
      if (!found.rows.length)
        return Response.json({ error: "投稿が見つかりません。" }, { status: 404 });
      await db().execute({
        sql: "INSERT INTO sc_replies (id, post_id, user_id, author, body, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        args: [id, v.postId, member.id, author, body, now],
      });
    } else {
      const title = typeof v.title === "string" ? v.title.trim() : "";
      if (!title || title.length > 120 || !CATEGORIES.includes(String(v.category)))
        return Response.json({ error: "タイトルとカテゴリを確認してください。" }, { status: 400 });
      await db().execute({
        sql: "INSERT INTO sc_posts (id, user_id, author, category, title, body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [id, member.id, author, String(v.category), title, body, now],
      });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "保存できませんでした。時間をおいて再度お試しください。" },
      { status: 500 },
    );
  }
}
