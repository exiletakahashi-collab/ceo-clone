# 引き継ぎ：アクセプトに「ストック商材一覧」を追加する

## 状況

- 公開中のサイト：https://platform-nu-eight-26.vercel.app/（Vercel プロジェクト「platform」、チーム `takahashis-projects-535b314c`）。
- 公開中の版は、掲示板・通知・料金ページに作り直したもの。そのソースは Vercel の最新の本番デプロイの中にだけある（GitHub には置いていない。オーナーのメールアドレス等を含むため、公開リポジトリには入れない）。
- 「ストック商材一覧」（/products）は作ってローカルで確認済み。ただし、Vercel トークンの期限切れで、まだデプロイしていない。

## 追加するもの

1. `files/src/lib/stock-products.ts` と `files/src/app/products/page.tsx` を、ソースの同じ場所に置く。
2. `src/app/layout.tsx` の `navLinks` で、`{ href: "/board", label: "掲示板" },` の次に、`{ href: "/products", label: "ストック商材" },` を足す。
3. `src/app/page.tsx` のトップの 2 つ目のボタン（`href="/billing"`「料金・できること」）を、`href="/products"`「ストック商材を見る」に変える。

## 手順

環境変数 `VERCEL_TOKEN`（範囲：高橋のプロジェクト）がある新しいセッションで行う。

1. Vercel API でソースを取り出す。`.env`・`.env.turso`・`dev.db` は取得しない。
   - `GET /v13/deployments/platform-nu-eight-26.vercel.app?teamId=team_J3HegLFq7ISxuPsn5KkIoYBQ` でデプロイ ID を取得する。
   - `GET /v6/deployments/{id}/files` でファイル一覧を取得する。
   - `GET /v7/deployments/{id}/files/{uid}` で各ファイルを取得する。
2. 上の「追加するもの」を反映し、`npm ci` → `DATABASE_URL=file:./local.db npm run build` が通ることを確認する。
3. `.vercel/project.json` に `{"orgId":"team_J3HegLFq7ISxuPsn5KkIoYBQ","projectId":"prj_7tyxglAMuSIm2VMWeytwZ4m4JZyX"}` を置き、`.vercelignore` に `node_modules .next .git *.db .env*` を書く。
4. `npx vercel deploy --prod --skip-domain --yes` で確認用 URL に出す（本番 URL は切り替わらない）。
5. ユーザーの OK をもらってから、`npx vercel promote <確認用URL> --scope takahashis-projects-535b314c --yes` で公開する。

## ユーザーに確認すること

- 「ライフサポートno」の正式な表記と内容。
- 3 商材それぞれの説明と報酬条件。今は「高橋から個別にご案内」と表示している。
