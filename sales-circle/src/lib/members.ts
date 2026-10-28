import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db } from "./db";

// 旧「プラットフォーム」の会員表（Prisma の User モデル）を読み取り専用で使う。
export type Member = { id: string; email: string; name: string };

const TABLE = process.env.MEMBER_TABLE ?? "User";
const PASSWORD_COLUMNS = ["passwordHash", "password_hash", "hashedPassword", "hashed_password", "password"];
const NAME_COLUMNS = ["name", "displayName", "display_name", "fullName", "full_name"];

type Columns = { password?: string; name?: string };
let columns: Promise<Columns> | undefined;

function quote(identifier: string): string {
  if (!/^\w+$/.test(identifier)) throw new Error(`不正な識別子: ${identifier}`);
  return `"${identifier}"`;
}

function memberColumns(): Promise<Columns> {
  columns ??= db()
    .execute(`PRAGMA table_info(${quote(TABLE)})`)
    .then(({ rows }) => {
      const names = rows.map((r) => String(r.name));
      return {
        password: PASSWORD_COLUMNS.find((c) => names.includes(c)),
        name: NAME_COLUMNS.find((c) => names.includes(c)),
      };
    })
    .catch((e) => {
      columns = undefined;
      throw e;
    });
  return columns;
}

function toMember(row: Record<string, unknown>, nameColumn?: string): Member {
  const email = String(row.email);
  const name = nameColumn && row[nameColumn] ? String(row[nameColumn]) : email.split("@")[0];
  return { id: String(row.id), email, name };
}

export async function findMemberById(id: string): Promise<Member | null> {
  const cols = await memberColumns();
  const { rows } = await db().execute({
    sql: `SELECT * FROM ${quote(TABLE)} WHERE id = ? LIMIT 1`,
    args: [id],
  });
  return rows[0] ? toMember(rows[0] as Record<string, unknown>, cols.name) : null;
}

export async function authenticateMember(email: string, password: string): Promise<Member | null> {
  const cols = await memberColumns();
  if (!cols.password) throw new Error(`会員表 ${TABLE} にパスワード列が見つかりません。`);
  const { rows } = await db().execute({
    sql: `SELECT * FROM ${quote(TABLE)} WHERE lower(email) = lower(?) LIMIT 1`,
    args: [email],
  });
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row || typeof row[cols.password] !== "string") return null;
  if (!(await verifyPassword(password, row[cols.password] as string))) return null;
  return toMember(row, cols.name);
}

const scryptAsync = promisify(scrypt) as (pw: string, salt: string, keylen: number) => Promise<Buffer>;

// 旧サイトのパスワード形式「salt:hash」（Node.js scrypt・16進）を検証する。
// 旧サイトのログイン処理を確認して、形式が異なればここだけを差し替える。
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash || !/^[0-9a-f]+$/i.test(hash)) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = await scryptAsync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}
