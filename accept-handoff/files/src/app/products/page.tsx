import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isActiveMember } from "@/lib/auth";
import { SHOT_PRODUCTS, STOCK_PRODUCTS, type Product } from "@/lib/stock-products";

export const metadata = { title: "商材一覧｜アクセプト" };

export default async function ProductsPage() {
  const user = await getCurrentUser();
  const active = user ? isActiveMember(user) : false;
  // 会員が登録し、審査を通過した商材（報酬条件を含むため月額会員だけに表示）
  const offers = active
    ? await prisma.offer.findMany({
        where: { status: "approved" },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-bold tracking-[0.2em] text-slate-500">STOCK PRODUCTS</p>
        <h1 className="mt-1 text-2xl font-extrabold">商材一覧</h1>
        <p className="mt-1 text-sm text-slate-500">
          ストックで月20万円以上をめざす商材と、単発で報酬が出るショット商材です。
        </p>
      </div>

      <ProductGroup
        title="ストック商材"
        note="毎月の継続報酬が積み上がる商材"
        products={STOCK_PRODUCTS}
        showPartner={active}
      />
      <ProductGroup
        title="ショット商材"
        note="成約ごとに報酬が出る単発の商材"
        products={SHOT_PRODUCTS}
        showPartner={active}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700">
        <p>
          各商材の内容・報酬条件は高橋から個別にご案内します。お客さまに合わせて、複数の商材を組み合わせたご提案も相談できます。
        </p>
        <Link
          href={active ? "/board/new?c=高橋に相談" : "/billing"}
          className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-blue-800 text-sm font-bold text-white hover:bg-blue-900 sm:w-64"
        >
          {active ? "高橋に相談する" : "月額会員について"}
        </Link>
      </section>

      {active && (
        <section>
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-bold">会員が登録した商材（審査通過）</h2>
            <Link href="/offers" className="shrink-0 text-sm text-blue-800 hover:underline">
              商材を登録・審査状況 →
            </Link>
          </div>
          {offers.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              まだ審査を通過した商材はありません。
            </p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {offers.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/offers/${o.id}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-400"
                  >
                    <p className="font-bold">{o.name}</p>
                    <p className="mt-1 text-sm text-slate-500">提供元：{o.provider || "未記載"}</p>
                    {o.commissionNote && (
                      <p className="mt-2 text-xs text-slate-600">報酬：{o.commissionNote}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <p className="text-xs text-slate-500">月20万円は目標であり、成果を保証するものではありません。</p>
    </div>
  );
}

function ProductGroup({
  title,
  note,
  products,
  showPartner,
}: {
  title: string;
  note: string;
  products: Product[];
  showPartner: boolean;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-extrabold">{title}</h2>
        <span className="text-xs text-slate-500">
          {note}・{products.length}件
        </span>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <li key={p.name} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-bold text-slate-900">{p.name}</p>
            {showPartner && p.partner && (
              <p className="mt-1 text-xs text-slate-500">担当：{p.partner}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
