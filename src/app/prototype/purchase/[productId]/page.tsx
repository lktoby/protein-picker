"use client";

// F-06 購入手続き（ネット通販・モック）（US-05）
// 支払い情報はすべてダミー。実在の個人情報は入力させない（Q-12: 選択肢A）。

import Link from "next/link";
import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { findProduct, formatYen, itemPriceOf, shippingFeeOf } from "../../_mock/products";
import { addOrder, type Order } from "../../_mock/orders";

const PAYMENT_METHODS = ["クレジットカード", "コンビニ払い", "銀行振込"] as const;

function PurchaseForm() {
  const { productId } = useParams<{ productId: string }>();
  const searchParams = useSearchParams();
  const product = findProduct(productId);
  const shop =
    product?.onlineShops.find((s) => s.id === searchParams.get("shop")) ??
    product?.onlineShops[0];

  // RV-12: 診断経由の文脈（from）を購入フローまで引き回す
  const from = searchParams.get("from");
  const fromRecommend = from !== null && from.startsWith("/prototype/recommend");

  const [quantity, setQuantity] = useState(1);
  const [payment, setPayment] = useState<(typeof PAYMENT_METHODS)[number]>("クレジットカード");
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [cardName, setCardName] = useState("PROTEIN TARO");
  const [cardExpiry, setCardExpiry] = useState("12/30");
  const [done, setDone] = useState<Order | null>(null);

  // RV-08: カード欄は編集不可（実在情報を入力させない）。ワンボタンでダミー値をランダム生成する
  const regenerateDummyCard = () => {
    const block = () => String(Math.floor(1000 + Math.random() * 9000));
    setCardNumber(`4${block().slice(1)} ${block()} ${block()} ${block()}`);
    const names = ["PROTEIN TARO", "DUMMY HANAKO", "SAMPLE ICHIRO", "MOCK YUKI"];
    setCardName(names[Math.floor(Math.random() * names.length)]);
    const mm = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    setCardExpiry(`${mm}/${28 + Math.floor(Math.random() * 4)}`);
  };

  if (!product || !shop) {
    return (
      <div className="text-center space-y-4 py-16">
        <p className="text-slate-600">商品が見つかりませんでした。</p>
        <Link href="/prototype/products" className="text-emerald-700 underline">
          商品一覧に戻る
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-bold">ご注文が完了しました（モック）</h1>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-left text-sm space-y-1">
          <p>
            <span className="text-slate-500">注文番号:</span> <b>{done.id}</b>
          </p>
          <p>
            <span className="text-slate-500">商品:</span> {done.productName}（{done.flavor}） × {done.quantity}
          </p>
          <p>
            <span className="text-slate-500">ショップ:</span> {done.shopName}
          </p>
          <p>
            <span className="text-slate-500">支払い方法:</span> {done.paymentMethod}（ダミー）
          </p>
          {/* RV-17: 注文直後のお届け状況 */}
          <p>
            <span className="text-slate-500">お届け状況:</span> 📝 注文済み
          </p>
          <p>
            <span className="text-slate-500">合計:</span>{" "}
            <b>{formatYen(done.unitPrice * done.quantity)}</b>
          </p>
        </div>
        <p className="text-xs text-slate-500">
          ※ 実際の決済・配送は行われません。注文はこのデモ内にのみ記録されています。
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/prototype/orders"
            className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
          >
            注文履歴を見る
          </Link>
          {/* RV-12: 診断経由なら結果に戻れる */}
          {fromRecommend && (
            <Link
              href={from}
              className="px-6 py-3 rounded-xl bg-white border border-slate-300 font-bold hover:border-emerald-400 transition"
            >
              診断結果に戻る
            </Link>
          )}
          <Link
            href="/prototype/products"
            className="px-6 py-3 rounded-xl bg-white border border-slate-300 font-bold hover:border-emerald-400 transition"
          >
            買い物を続ける
          </Link>
        </div>
      </div>
    );
  }

  const total = shop.price * quantity;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* RV-12: 戻っても診断文脈（from）を失わない */}
      <Link
        href={`/prototype/products/${product.id}${
          fromRecommend ? `?from=${encodeURIComponent(from)}` : ""
        }`}
        className="text-sm text-emerald-700 hover:underline"
      >
        ← 商品詳細に戻る
      </Link>
      <h1 className="text-2xl font-bold">🛒 購入手続き</h1>

      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 text-sm">
        ⚠️ これはダミーの購入画面です。実際の支払いは発生しません。
        <b>実在のカード番号・氏名などの個人情報は入力しないでください</b>（ダミー値のまま確定できます）。
      </div>

      {/* 注文内容 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-bold">注文内容</h2>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0"
            style={{
              background: `linear-gradient(135deg, ${product.colors[0]}, ${product.colors[1]})`,
            }}
          >
            {product.emoji}
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-500">{product.brand}</div>
            <div className="font-bold">
              {product.name} <span className="text-sm font-normal">{product.flavor}</span>
            </div>
            <div className="text-sm text-slate-600">
              {shop.name}・{formatYen(shop.price)}
              <span className="text-xs text-slate-500">
                （{shippingFeeOf(shop.id) === 0 ? "送料無料" : "送料込み"}）
              </span>
            </div>
          </div>
          <label className="text-sm flex items-center gap-2">
            数量
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        {/* RV-16: 合計の内訳（商品代金・送料）を明記する */}
        <dl className="border-t border-slate-100 pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">
              商品代金（{formatYen(itemPriceOf(shop))} × {quantity}）
            </dt>
            <dd>{formatYen(itemPriceOf(shop) * quantity)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">送料</dt>
            <dd className={shippingFeeOf(shop.id) === 0 ? "text-emerald-700" : undefined}>
              {shippingFeeOf(shop.id) === 0
                ? "無料"
                : formatYen(shippingFeeOf(shop.id) * quantity)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-lg">
            <dt>合計</dt>
            <dd>{formatYen(total)}</dd>
          </div>
        </dl>
      </section>

      {/* 支払い方法（ダミー） */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-bold">お支払い方法（ダミー）</h2>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPayment(m)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                payment === m
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-700 border-slate-300 hover:border-emerald-400"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {payment === "クレジットカード" && (
          <div className="space-y-3">
            {/* RV-08: 入力欄は readOnly。ダミー値のランダム生成のみ可能 */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                入力欄は編集できません（実在のカード情報を入力させないため）
              </p>
              <button
                type="button"
                onClick={regenerateDummyCard}
                className="shrink-0 text-sm text-emerald-700 font-bold hover:underline"
              >
                🎲 ダミー値をランダム生成
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-sm space-y-1 sm:col-span-2">
                <span className="text-slate-600">カード番号（ダミー値）</span>
                <input
                  value={cardNumber}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 text-slate-600 px-3 py-2 font-mono"
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="text-slate-600">カード名義（ダミー値）</span>
                <input
                  value={cardName}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 text-slate-600 px-3 py-2 font-mono"
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="text-slate-600">有効期限（ダミー値）</span>
                <input
                  value={cardExpiry}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 text-slate-600 px-3 py-2 font-mono"
                />
              </label>
            </div>
          </div>
        )}
        {payment !== "クレジットカード" && (
          <p className="text-sm text-slate-500">
            {payment}を選択しました。デモのため、このまま注文を確定できます。
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={() =>
          setDone(
            addOrder({
              productId: product.id,
              productName: product.name,
              brand: product.brand,
              flavor: product.flavor,
              emoji: product.emoji,
              colors: product.colors,
              shopName: shop.name,
              unitPrice: shop.price,
              quantity,
              paymentMethod: payment,
              contactEmail: shop.email,
              contactPhone: shop.phone,
            })
          )
        }
        className="w-full px-8 py-4 rounded-xl bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-700 transition"
      >
        注文を確定する（ダミー決済）
      </button>
    </div>
  );
}

export default function PurchasePage() {
  return (
    <Suspense fallback={<p className="text-center py-16 text-slate-500">読み込み中…</p>}>
      <PurchaseForm />
    </Suspense>
  );
}
