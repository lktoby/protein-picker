"use client";

// F-04 商品情報の一気見（US-04） / F-05 実店舗情報の表示（US-08）
// RV-02: 遷移元（おすすめ診断）に応じた戻り導線を出す

import Link from "next/link";
import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  findProduct,
  formatYen,
  minOnlinePrice,
  pricePerGram,
  PREFERENCE_LABELS,
  shippingFeeOf,
  shippingBreakdownLabel,
  shippingNoteOf,
} from "../../_mock/products";

function ProductDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const product = findProduct(id);

  // RV-02: おすすめ診断から来た場合は診断結果へ戻れるようにする（サイト内パスのみ許可）
  const from = searchParams.get("from");
  const fromRecommend = from !== null && from.startsWith("/prototype/recommend");

  if (!product) {
    return (
      <div className="text-center space-y-4 py-16">
        <p className="text-slate-600">商品が見つかりませんでした。</p>
        <Link href="/prototype/products" className="text-emerald-700 underline">
          商品一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href={fromRecommend ? from : "/prototype/products"}
        className="text-sm text-emerald-700 hover:underline"
      >
        ← {fromRecommend ? "おすすめ結果に戻る" : "商品一覧に戻る"}
      </Link>

      {/* 商品サマリー */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="sm:flex">
          <div
            className="sm:w-64 h-48 sm:h-auto flex items-center justify-center text-8xl shrink-0"
            style={{
              background: `linear-gradient(135deg, ${product.colors[0]}, ${product.colors[1]})`,
            }}
          >
            {product.emoji}
          </div>
          <div className="p-6 space-y-3">
            <div>
              <div className="text-sm text-slate-500">{product.brand}</div>
              <h1 className="text-2xl font-bold">
                {product.name}{" "}
                <span className="text-base font-normal text-slate-500">{product.flavor}</span>
              </h1>
            </div>
            <p className="text-slate-600 text-sm">{product.description}</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                {product.type}
              </span>
              {product.preferences.map((pref) => (
                <span
                  key={pref}
                  className="text-xs bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5"
                >
                  {PREFERENCE_LABELS[pref]}
                </span>
              ))}
            </div>
            {/* 一気見スペック */}
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                // RV-18①: 「最安値」の下に送料の金額を添える
                ["最安値", `${formatYen(minOnlinePrice(product))}（${shippingNoteOf(product)}）`],
                ["1gあたり", `約${pricePerGram(product).toFixed(1)}円`],
                ["タンパク質含有率", `${product.proteinContent}%`],
                ["内容量", `${product.weightG.toLocaleString()}g`],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ネット通販 */}
      <section className="space-y-3">
        <h2 className="font-bold text-lg">🛒 ネット通販で買う</h2>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {/* RV-11: 価格の安い順に並べ、最安を明示する */}
          {[...product.onlineShops]
            .sort((a, b) => a.price - b.price)
            .map((shop, i) => (
              <div
                key={shop.id}
                className="flex flex-wrap items-center gap-3 px-5 py-4"
              >
                <div className="flex-1 min-w-40">
                  <div className="font-medium flex items-center gap-2">
                    {shop.name}
                    {i === 0 && (
                      <span className="text-xs bg-emerald-600 text-white font-bold rounded-full px-2 py-0.5">
                        最安
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    1gあたり 約{(shop.price / product.weightG).toFixed(1)}円
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{formatYen(shop.price)}</div>
                  {/* RV-16: 送料の内訳を明記する */}
                  <div
                    className={`text-xs ${
                      shippingFeeOf(shop.id) === 0 ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    {shippingBreakdownLabel(shop)}
                  </div>
                </div>
                <Link
                  href={`/prototype/purchase/${product.id}?shop=${shop.id}${
                    fromRecommend ? `&from=${encodeURIComponent(from)}` : ""
                  }`}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition"
                >
                  このショップで購入
                </Link>
              </div>
            ))}
        </div>
        <p className="text-xs text-slate-500">
          ※ 表示価格はすべて送料込みで、各行に内訳（商品代金 + 送料）を記載しています。
          デモのため購入はモックで、実際の決済・注文は発生しません。
        </p>
      </section>

      {/* 実店舗 */}
      <section className="space-y-3">
        <h2 className="font-bold text-lg">🏬 実店舗で買う</h2>
        {product.stores.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-500">
            この商品を取り扱っている実店舗のデータはありません。
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {product.stores.map((store) => (
              <div key={store.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-bold">{store.name}</div>
                  <div className="font-bold text-lg shrink-0">{formatYen(store.price)}</div>
                </div>
                <dl className="text-sm text-slate-600 space-y-1">
                  <div className="flex gap-2">
                    <dt className="shrink-0">🚃 アクセス:</dt>
                    <dd>{store.access}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0">📞 電話:</dt>
                    <dd>{store.phone}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0">🕙 営業時間:</dt>
                    <dd>{store.hours}</dd>
                  </div>
                  {/* RV-16: 店頭購入は送料が発生しないことを明記 */}
                  <div className="text-xs text-slate-500">店頭でのお渡しのため送料はかかりません</div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<p className="text-center py-16 text-slate-500">読み込み中…</p>}>
      <ProductDetailContent />
    </Suspense>
  );
}
