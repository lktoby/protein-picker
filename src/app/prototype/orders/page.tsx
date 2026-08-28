"use client";

// F-07 注文履歴の表示（US-06） / F-08 商品お問い合わせ先の表示（US-07）
// RV-10: 商品クリックで商品詳細へ / RV-17: お届け状況の表示

import Link from "next/link";
import { useState } from "react";
import {
  getOrders,
  advanceStatusForDemo,
  DELIVERY_STATUS_LABELS,
  type DeliveryStatus,
} from "../_mock/orders";
import { formatYen } from "../_mock/products";

const STATUS_STYLES: Record<DeliveryStatus, string> = {
  ordered: "bg-slate-100 text-slate-700",
  shipping: "bg-sky-100 text-sky-800",
  delivered: "bg-emerald-100 text-emerald-800",
};

const STATUS_ICONS: Record<DeliveryStatus, string> = {
  ordered: "📝",
  shipping: "🚚",
  delivered: "📬",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState(() => getOrders());
  const [openContactId, setOpenContactId] = useState<string | null>(null);

  const advance = (id: string) => {
    advanceStatusForDemo(id);
    setOrders([...getOrders()]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">📦 注文履歴</h1>
        <p className="text-slate-600 text-sm mt-1">
          このデモで注文した商品と、お届け状況の一覧です。商品について困ったら「お問い合わせ」から販売店舗の連絡先を確認できます。
        </p>
      </div>

      <div className="bg-slate-100 text-slate-600 rounded-xl px-4 py-2.5 text-xs">
        ℹ️ デモの注文履歴はブラウザをリロードすると消えます（本実装ではデータベースに保存する予定）。
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4">
          <div className="text-4xl">🛍️</div>
          <p className="text-slate-600">まだ注文がありません。まずは自分に合う一本を見つけましょう。</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/prototype/recommend"
              className="inline-block px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
            >
              🎯 おすすめ診断で選ぶ
            </Link>
            <Link
              href="/prototype/products"
              className="inline-block px-6 py-3 rounded-xl bg-white border border-slate-300 font-bold hover:border-emerald-400 transition"
            >
              商品をさがす
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  注文番号 <b className="text-slate-700">{order.id}</b>
                </span>
                <span>{order.orderedAt}</span>
              </div>
              <div className="flex items-center gap-4">
                {/* RV-10: 商品クリックで商品詳細ページへ */}
                <Link
                  href={`/prototype/products/${order.productId}`}
                  className="flex items-center gap-4 flex-1 min-w-0 rounded-xl -m-1 p-1 hover:bg-slate-50 transition"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${order.colors[0]}, ${order.colors[1]})`,
                    }}
                  >
                    {order.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* RV-17: 商品名の上はブランドではなくお届け状況を表示する */}
                    <div>
                      <span
                        className={`inline-block text-xs font-bold rounded-full px-2 py-0.5 ${
                          STATUS_STYLES[order.status]
                        }`}
                      >
                        {STATUS_ICONS[order.status]} {DELIVERY_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <div className="font-bold mt-1">
                      {order.productName}{" "}
                      <span className="text-sm font-normal text-slate-500">{order.flavor}</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {order.shopName}・{formatYen(order.unitPrice)} × {order.quantity} ={" "}
                      <b>{formatYen(order.unitPrice * order.quantity)}</b>・{order.paymentMethod}
                    </div>
                    <div className="text-xs text-emerald-700 mt-0.5">商品詳細を見る →</div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    setOpenContactId((cur) => (cur === order.id ? null : order.id))
                  }
                  className="shrink-0 px-4 py-2 rounded-xl border border-emerald-600 text-emerald-700 text-sm font-bold hover:bg-emerald-50 transition"
                >
                  {openContactId === order.id ? "閉じる" : "お問い合わせ"}
                </button>
              </div>

              {openContactId === order.id && (
                <div className="bg-emerald-50 rounded-xl p-4 text-sm space-y-1">
                  <p className="font-bold text-emerald-900">
                    この商品のお問い合わせ先（販売ショップ: {order.shopName}）
                  </p>
                  <p>
                    ✉️ メール: <span className="font-mono">{order.contactEmail}</span>
                  </p>
                  <p>
                    📞 電話: <span className="font-mono">{order.contactPhone}</span>
                  </p>
                  <p className="text-xs text-emerald-700">
                    ※ デモのため表示のみです。実際のメール送信・発信は行いません。
                  </p>
                </div>
              )}

              {/* デモ専用の操作。本実装では配送情報から自動で更新される（ui-spec.md §8） */}
              {order.status !== "delivered" && (
                <div className="border-t border-dashed border-slate-200 pt-3">
                  <button
                    type="button"
                    onClick={() => advance(order.id)}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    🔧 デモ用: お届け状況を次に進める（
                    {DELIVERY_STATUS_LABELS[order.status === "ordered" ? "shipping" : "delivered"]}
                    ）
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
