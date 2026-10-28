import { authenticateMember } from "@/lib/members";
import { createSessionValue, isSameOrigin, sessionCookie } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  if (!isSameOrigin(req))
    return Response.json({ error: "アクセスを確認できません。" }, { status: 403 });
  try {
    const v = (await req.json()) as Record<string, unknown>;
    const email = typeof v.email === "string" ? v.email.trim() : "";
    const password = typeof v.password === "string" ? v.password : "";
    if (!email || !password || email.length > 254 || password.length > 200)
      return Response.json({ error: "メールアドレスとパスワードを入力してください。" }, { status: 400 });
    const member = await authenticateMember(email, password);
    if (!member)
      return Response.json(
        { error: "メールアドレスまたはパスワードが正しくありません。" },
        { status: 401 },
      );
    (await cookies()).set(sessionCookie.name, createSessionValue(member.id), sessionCookie.options);
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "ログインできませんでした。時間をおいて再度お試しください。" },
      { status: 500 },
    );
  }
}
