# SALES CIRCLE（Vercel 版）

営業コミュニティ SALES CIRCLE を、Vercel の「プラットフォーム」プロジェクト（platform-nu-eight-26.vercel.app）で動かすための版です。
デザインと機能は OpenAI Sites 版をそのまま移し、ログインと保存先だけを旧「プラットフォーム」と同じ Turso DB に切り替えています。

## 登録済みの会員について

- 旧サイトの会員表（Prisma の `User` 表）を **読み取りのみ** で使います。会員の追加・変更・削除はしません。
- 登録済みの人は、これまでと同じメールアドレスとパスワードでログインできます。
- 掲示板の投稿・返信は、新しい表 `sc_posts` / `sc_replies` に保存します（初回アクセス時に自動作成）。

## 環境変数（Vercel に設定済みのものをそのまま使用）

| 変数名 | 用途 |
| --- | --- |
| `DATABASE_URL`（または `TURSO_DATABASE_URL`） | Turso の接続先 |
| `DATABASE_AUTH_TOKEN`（または `TURSO_AUTH_TOKEN`） | Turso の認証トークン |
| `SESSION_SECRET` | ログイン Cookie の署名 |
| `MEMBER_TABLE`（任意） | 会員表の名前。既定は `User` |

`STRIPE_SECRET_KEY` はこの版では使いません。

## Vercel への接続

1. 「プラットフォーム」→ 設定 → Git で、GitHub の `exiletakahashi-collab/ceo-clone` を接続する。
2. 設定 → ビルドとデプロイ → Root Directory を `sales-circle` にする。Framework は Next.js、Build Command は既定（上書きしない）。
3. 環境変数のうち Turso の 2 つと `SESSION_SECRET` に「Preview」にもチェックを入れる。
4. `claude/new-session-aucst4` ブランチのプレビュー URL で、実際の会員アカウントでログインできることを確認する。
5. 問題なければ、そのデプロイの「…」→「本番環境に昇格（Promote to Production）」で公開する。

## 開発

```bash
npm install
DATABASE_URL=file:./dev.db SESSION_SECRET=任意の16文字以上 npm run dev
```
