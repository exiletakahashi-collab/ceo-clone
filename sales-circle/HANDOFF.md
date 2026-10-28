# 引き継ぎメモ：アクセプトの見た目変更

## 依頼内容（ユーザー確定済み）

- 対象：Vercel の「プラットフォーム」プロジェクト（https://platform-nu-eight-26.vercel.app/ ほか独自ドメイン 2 つ）。サイト名は「アクセプト」。
- **アクセプトの機能（無料登録・ログイン・課題ボード・スポンサー募集など）と登録済み会員はそのまま残し、見た目だけ変える。** サイト名もアクセプトのまま。
- デザインはこのフォルダの SALES CIRCLE（`src/app/globals.css`：深緑 #164e3e とアイボリー、Noto Sans JP）を基本に提案し、OK をもらってから仕上げる。
- このフォルダの SALES CIRCLE 版アプリ自体はたたき台。そのまま公開はしない。

## アクセプトの構成（Vercel の画面から確認）

- Next.js 16.2 / React 19.2 / Prisma 7（`@prisma/adapter-libsql`）/ Turso（`@libsql/client`）/ Stripe。
- build：`prisma generate && next build`
- ルートのファイル：`prisma/`、`public/`、`src/`、`AGENTS.md`、`CLAUDE.md`、`create-test-user.mjs`、`list-users.mjs`、`create-checkout-tes…`、`dev.db`、`.env`、`.env.turso` など。
- 環境変数：データベース認証トークン、セッションシークレット、`STRIPE_SECRET_KEY` ほか（計 4 種、開発・本番のみ）。
- Git 未接続。h-takahashi が 6 月 4 日に CLI でデプロイ（デプロイ ID `5TPN37QvS`）。チームは `takahashis-projects-535b314c`。
- 元のソースフォルダはユーザーの PC に見つからなかった。

## ソースの取り出し方

環境変数 `VERCEL_TOKEN` と、ネットワークで `api.vercel.com` を許可した新しいセッションで行う。

1. `GET https://api.vercel.com/v13/deployments/platform-nu-eight-26.vercel.app?slug=takahashis-projects-535b314c` でデプロイ ID を取得する。
2. `GET /v6/deployments/{id}/files?slug=…` でファイル一覧を取得する。
3. 各ファイルを `GET /v7/deployments/{id}/files/{uid}?slug=…` で取得する。
4. **`.env`、`.env.turso`、`dev.db` は取得もコミットもしない。** 秘密情報とローカル DB のため。
5. 取得したソースをリポジトリの新しいフォルダ（例 `accept/`）に置き、ビルドが通ることを確認する。
6. 見た目だけを変える。会員表・Prisma スキーマ・ログイン処理は変えない。

## 公開の流れ

- Vercel「プラットフォーム」→ 設定 → Git で `exiletakahashi-collab/ceo-clone` を接続し、Root Directory をソースのフォルダにする。
- プレビューで実会員のログインを確認したうえで、本番環境に昇格する。
