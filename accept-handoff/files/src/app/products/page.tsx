import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isActiveMember } from "@/lib/auth";
import { STOCK_PRODUCTS } from "@/lib/stock-products";

export const metadata = { title: "ストック商材一覧｜アクセプト" };

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
        <h1 className="mt-1 text-2xl font-extrabold">ストック商材一覧</h1>
        <p className="mt-1 text-sm text-slate-500">
          毎月の継続報酬が積み上がる商材です。ストックで月20万円以上をめざしましょう。
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {STOCK_PRODUCTS.map((p) => (
          <div key={p.name} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
            <span className="w-fit rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-900">
              ストック商材
            </span>
            <h2 className="mt-3 text-lg font-extrabold text-slate-900">{p.name}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{p.summary}</p>
            <dl className="mt-4 border-t border-slate-100 pt-3 text-xs">
              <dt className="text-slate-500">報酬・継続条件</dt>
              <dd className="mt-0.5 text-slate-700">高橋から個別にご案内します</dd>
            </dl>
            <Link
              href={active ? "/board/new?c=高橋に相談" : "/billing"}
              className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-blue-800 text-sm font-bold text-white hover:bg-blue-900"
            >
              {active ? "高橋に相談する" : "月額会員について"}
            </Link>
          </div>
        ))}
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
