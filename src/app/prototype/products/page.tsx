"use client";

// F-03 商品検索（US-03）

import Link from "next/link";
import { useState } from "react";
import {
  PRODUCTS,
  minOnlinePrice,
  pricePerGram,
  formatYen,
  shippingNoteOf,
} from "../_mock/products";

export default function ProductsPage() {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? PRODUCTS.filter((p) =>
        `${p.name} ${p.brand} ${p.flavor} ${p.type}`.toLowerCase().includes(q)
      )
    : PRODUCTS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🔍 商品をさがす</h1>
        <p className="text-slate-600 text-sm mt-1">
          商品名・ブランド名で検索できます。価格（1gあたり）とタンパク質含有率を一覧で比較。表示価格はすべて送料込みで、内訳は商品詳細で確認できます。
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="例: ホエイ、筋トレ堂、ソイスリム…"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      <p className="text-sm text-slate-500">{filtered.length} 件</p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-600">
          「{query}」に一致する商品が見つかりませんでした。
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/prototype/products/${p.id}`}
              className="block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-emerald-400 transition"
            >
              <div
                className="h-28 flex items-center justify-center text-5xl"
                style={{
                  background: `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})`,
                }}
              >
                {p.emoji}
              </div>
              <div className="p-4 space-y-2">
                <span className="inline-block text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                  {p.type}
                </span>
                <div>
                  <div className="text-xs text-slate-500">{p.brand}</div>
                  <div className="font-bold leading-snug">
                    {p.name}{" "}
                    <span className="text-xs font-normal text-slate-500">{p.flavor}</span>
                  </div>
                </div>
                <div className="text-sm text-slate-700 flex flex-wrap gap-x-3">
                  <span className="font-bold">{formatYen(minOnlinePrice(p))}〜</span>
                  <span>1gあたり 約{pricePerGram(p).toFixed(1)}円</span>
                  <span>タンパク質 {p.proteinContent}%</span>
                </div>
                {/* RV-18①: 送料は「込み」で終わらせず金額を明記する */}
                <div className="text-xs text-slate-500">{shippingNoteOf(p)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
