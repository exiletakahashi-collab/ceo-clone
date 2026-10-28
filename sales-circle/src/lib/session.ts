import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { findMemberById, type Member } from "./members";

const COOKIE = "sc_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) throw new Error("SESSION_SECRET が設定されていません。");
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionValue(memberId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: memberId, exp: Math.floor(Date.now() / 1000) + MAX_AGE }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export const sessionCookie = {
  name: COOKIE,
  options: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: MAX_AGE },
};

function readSession(value: string | undefined): string | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      uid?: unknown;
      exp?: unknown;
    };
    if (typeof uid !== "string" || typeof exp !== "number" || exp * 1000 < Date.now()) return null;
    return uid;
  } catch {
    return null;
  }
}

// 署名済みの Cookie を検証し、会員表に今も存在する人だけをログイン中とみなす。
export async function getCurrentMember(): Promise<Member | null> {
  const uid = readSession((await cookies()).get(COOKIE)?.value);
  return uid ? findMemberById(uid) : null;
}

export function isSameOrigin(req: Request): boolean {
  return req.headers.get("origin") === new URL(req.url).origin;
}
