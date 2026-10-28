"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      const d = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(d.error);
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "ログインに失敗しました。");
      setSaving(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <label>
        メールアドレス
        <input name="email" type="email" required autoComplete="email" maxLength={254} />
      </label>
      <label>
        パスワード
        <input name="password" type="password" required autoComplete="current-password" maxLength={200} />
      </label>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      <button className="primary" disabled={saving}>
        {saving ? "確認中…" : "ログイン"}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
