import Link from "next/link";

export default function PrototypeHome() {
  return (
    <div className="space-y-10">
      <section className="text-center space-y-4 py-8">
        <h1 className="text-3xl sm:text-4xl font-bold">
          はじめてのプロテイン、
          <br className="sm:hidden" />
          <span className="text-emerald-700">迷わず選べる。</span>
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto">
          目的・飲みたいタイミング・こだわりを選ぶだけで、あなたに合ったプロテインをおすすめ。
          ネット通販の価格も実店舗の情報も、ここでまとめて比較できます。
        </p>
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <Link
          href="/prototype/recommend"
          className="block rounded-2xl bg-emerald-600 text-white p-6 shadow hover:bg-emerald-700 transition"
        >
          <div className="text-3xl mb-2">🎯</div>
          <div className="font-bold text-lg">おすすめ診断</div>
          <p className="text-sm text-emerald-50 mt-1">
            3つの質問に答えて、自分に合う一本を見つける（初心者向け）
          </p>
        </Link>
        <Link
          href="/prototype/products"
          className="block rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:border-emerald-400 transition"
        >
          <div className="text-3xl mb-2">🔍</div>
          <div className="font-bold text-lg">商品をさがす</div>
          <p className="text-sm text-slate-500 mt-1">
            商品名・ブランド名で検索して、価格や成分を一気見する
          </p>
        </Link>
        <Link
          href="/prototype/orders"
          className="block rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:border-emerald-400 transition"
        >
          <div className="text-3xl mb-2">📦</div>
          <div className="font-bold text-lg">注文履歴</div>
          <p className="text-sm text-slate-500 mt-1">
            注文した商品の確認と、販売店舗へのお問い合わせ先
          </p>
        </Link>
      </section>
    </div>
  );
}
