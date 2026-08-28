"use client";

// F-01 おすすめ条件の選択 / F-02 おすすめ商品の提示（US-01, US-02）
// RV-02: 診断条件を URL クエリに保持し、戻ってきたときに結果を復元する
// RV-05: 実行後に結果へ自動スクロール／条件変更時は結果をグレーアウトして再実行を促す
// RV-06: カルーセルのスワイプ対応・ドットのタップ領域拡大
// RV-09: 順位根拠（✓ 一致条件チップ・採点基準の説明・理由に総額）

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PURPOSE_LABELS,
  TIMING_LABELS,
  PREFERENCE_LABELS,
  type Purpose,
  type Timing,
  type Preference,
  type Recommendation,
  recommend,
  minOnlinePrice,
  pricePerGram,
  formatYen,
  shippingNoteOf,
  cheapestSourceName,
} from "../_mock/products";

function Pill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
        selected
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-white text-slate-700 border-slate-300 hover:border-emerald-400"
      }`}
    >
      {children}
    </button>
  );
}

function isPurpose(v: string | null): v is Purpose {
  return v !== null && v in PURPOSE_LABELS;
}
function isTiming(v: string | null): v is Timing {
  return v !== null && v in TIMING_LABELS;
}
function parsePrefs(v: string | null): Preference[] {
  return (v ?? "")
    .split(",")
    .filter((x): x is Preference => x in PREFERENCE_LABELS);
}

type Applied = { purpose: Purpose; timing: Timing; prefs: Preference[] };

function buildQuery(a: Applied): string {
  const q = new URLSearchParams({ purpose: a.purpose, timing: a.timing });
  if (a.prefs.length) q.set("prefs", a.prefs.join(","));
  return q.toString();
}

function RecommendContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [timing, setTiming] = useState<Timing | null>(null);
  const [prefs, setPrefs] = useState<Preference[]>([]);
  const [applied, setApplied] = useState<Applied | null>(null);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [index, setIndex] = useState(0);
  const [invalidLink, setInvalidLink] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  const restored = useRef(false);

  // RV-02: URL クエリから条件と結果を復元（初回マウント時のみ）
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const p = searchParams.get("purpose");
    const t = searchParams.get("timing");
    if (isPurpose(p) && isTiming(t)) {
      const pf = parsePrefs(searchParams.get("prefs"));
      setPurpose(p);
      setTiming(t);
      setPrefs(pf);
      setApplied({ purpose: p, timing: t, prefs: pf });
      setResults(recommend({ purpose: p, timing: t, preferences: pf }));
    } else if (p !== null || t !== null) {
      // 不正な条件付きリンクを黙って無視しない
      setInvalidLink(true);
    }
  }, [searchParams]);

  const togglePref = (p: Preference) =>
    setPrefs((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const run = () => {
    if (!purpose || !timing) return;
    setInvalidLink(false);
    const a: Applied = { purpose, timing, prefs: [...prefs] };
    setResults(recommend({ purpose, timing, preferences: prefs }));
    setApplied(a);
    setIndex(0);
    router.replace(`/prototype/recommend?${buildQuery(a)}`, { scroll: false });
    // RV-05: 結果セクションへ自動スクロール
    setTimeout(
      () => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50
    );
  };

  // RV-05: 表示中の結果と選択中の条件のズレを検知
  const dirty =
    !!applied &&
    (applied.purpose !== purpose ||
      applied.timing !== timing ||
      applied.prefs.length !== prefs.length ||
      applied.prefs.some((p) => !prefs.includes(p)));

  // RV-06: スワイプでカルーセルを移動
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !results) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -40) setIndex((i) => Math.min(results.length - 1, i + 1));
    if (dx > 40) setIndex((i) => Math.max(0, i - 1));
  };

  const current = results?.[index];
  const backTo = applied
    ? encodeURIComponent(`/prototype/recommend?${buildQuery(applied)}`)
    : "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">🎯 おすすめ診断</h1>
        <p className="text-slate-600 text-sm mt-1">
          3つの質問に答えると、あなたに合ったプロテインをおすすめ順に表示します。
        </p>
      </div>

      {invalidLink && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-2.5 text-sm">
          ⚠️ リンクに含まれていた診断条件が無効だったため、復元できませんでした。条件を選び直してください。
        </div>
      )}

      {/* F-01: 条件の選択 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="font-bold mb-3">
            1. プロテインを飲む目的は？ <span className="text-rose-600 text-xs">必須</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PURPOSE_LABELS) as Purpose[]).map((k) => (
              <Pill key={k} selected={purpose === k} onClick={() => setPurpose(k)}>
                {PURPOSE_LABELS[k]}
              </Pill>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-bold mb-3">
            2. 主に飲みたいタイミングは？ <span className="text-rose-600 text-xs">必須</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TIMING_LABELS) as Timing[]).map((k) => (
              <Pill key={k} selected={timing === k} onClick={() => setTiming(k)}>
                {TIMING_LABELS[k]}
              </Pill>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-bold mb-3">
            3. こだわりはありますか？ <span className="text-slate-400 text-xs">複数選択可・任意</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PREFERENCE_LABELS) as Preference[]).map((k) => (
              <Pill key={k} selected={prefs.includes(k)} onClick={() => togglePref(k)}>
                {PREFERENCE_LABELS[k]}
              </Pill>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            「乳糖不耐症？」など用語がわからないときは{" "}
            <Link href="/prototype/glossary" className="text-emerald-700 underline">
              用語説明
            </Link>{" "}
            をどうぞ
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={!purpose || !timing}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold disabled:bg-slate-300 hover:bg-emerald-700 transition"
        >
          おすすめを見る
        </button>
      </section>

      {/* F-02: おすすめのカルーセル表示 */}
      {results && results.length === 0 && (
        <section ref={resultsRef} className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-600">
          条件に合う商品が見つかりませんでした。こだわり条件を減らして試してみてください。
        </section>
      )}

      {results && current && (
        <section ref={resultsRef} className="space-y-4 scroll-mt-20">
          {/* RV-05: 条件変更時の注意表示（RV-13: 再実行ボタンをバナー側に用意） */}
          {dirty && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-2.5 text-sm flex flex-wrap items-center justify-between gap-2">
              <span>⚠️ 条件が変更されています。この結果は古い条件のものです。</span>
              <button
                type="button"
                onClick={run}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition"
              >
                新しい条件でおすすめを見る
              </button>
            </div>
          )}

          {/* RV-13: 古い結果は操作不可にする（inert でキーボードフォーカスもブロック） */}
          <div
            className={
              dirty
                ? "opacity-40 pointer-events-none select-none transition-opacity space-y-4"
                : "space-y-4"
            }
            inert={dirty}
          >
            <div>
              <h2 className="font-bold text-lg">
                あなたへのおすすめ{" "}
                <span className="text-sm font-normal text-slate-500">
                  （{results.length}件・おすすめ順）
                </span>
              </h2>
              {/* RV-09: 順位付けの根拠を明示 */}
              <p className="text-xs text-slate-500 mt-1">
                順位は「選んだ条件との一致度」と「価格（1gあたり・総額）」の総合で決まります。カードの ✓ が一致した条件です。
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
                aria-label="前のおすすめ"
                className="shrink-0 w-10 h-10 rounded-full bg-white border border-slate-300 font-bold disabled:opacity-30 hover:border-emerald-400"
              >
                ←
              </button>

              {/* おすすめカード（カルーセル：1件ずつ表示・RV-06: スワイプ対応・矢印キー対応） */}
              <div
                className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden touch-pan-y outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                tabIndex={0}
                role="group"
                aria-label={`おすすめ ${index + 1} 位 / ${results.length} 件: ${current.product.name}。左右の矢印キーで移動できます`}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
                  if (e.key === "ArrowRight")
                    setIndex((i) => Math.min(results.length - 1, i + 1));
                }}
              >
                <div
                  className="h-44 flex items-center justify-center text-7xl relative"
                  style={{
                    background: `linear-gradient(135deg, ${current.product.colors[0]}, ${current.product.colors[1]})`,
                  }}
                >
                  <span className="absolute top-3 left-3 bg-white/90 text-emerald-700 text-sm font-bold px-3 py-1 rounded-full">
                    おすすめ {index + 1} 位
                  </span>
                  {current.product.emoji}
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <div className="text-xs text-slate-500">{current.product.brand}</div>
                    <div className="font-bold text-lg leading-snug">
                      {current.product.name}{" "}
                      <span className="text-sm font-normal text-slate-500">
                        {current.product.flavor}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      {/* RV-18①: 「最安値・送料込み」ではなく送料の金額を明記する */}
                      <span className="text-xl font-bold text-slate-900">
                        {formatYen(minOnlinePrice(current.product))}
                        <span className="text-xs font-normal text-slate-500">
                          （{shippingNoteOf(current.product)}）
                        </span>
                      </span>
                      <span className="text-sm text-slate-600">
                        1gあたり 約{pricePerGram(current.product).toFixed(1)}円
                      </span>
                      <span className="text-sm text-slate-600">
                        タンパク質 {current.product.proteinContent}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      最安値: {cheapestSourceName(current.product)}
                    </p>
                  </div>
                  {/* RV-09: 一致した条件のチップ（順位根拠） */}
                  {current.matches.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {current.matches.map((m) => (
                        <span
                          key={m}
                          className="text-xs bg-emerald-100 text-emerald-800 rounded-full px-2 py-0.5"
                        >
                          ✓ {m}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm bg-emerald-50 text-emerald-900 rounded-lg px-3 py-2">
                    💡 {current.reason}
                  </p>
                  <Link
                    href={`/prototype/products/${current.product.id}?from=${backTo}`}
                    className="block text-center w-full px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                  >
                    詳細・購入方法を見る
                  </Link>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(results.length - 1, i + 1))}
                disabled={index === results.length - 1}
                aria-label="次のおすすめ"
                className="shrink-0 w-10 h-10 rounded-full bg-white border border-slate-300 font-bold disabled:opacity-30 hover:border-emerald-400"
              >
                →
              </button>
            </div>

            {/* インジケーター（RV-06/RV-14: タップ領域を 44px 相当に拡大） */}
            <div className="flex justify-center">
              {results.map((r, i) => (
                <button
                  key={r.product.id + r.product.flavor}
                  type="button"
                  aria-label={`${i + 1}位を表示`}
                  onClick={() => setIndex(i)}
                  className="p-4"
                >
                  <span
                    className={`block w-3 h-3 rounded-full ${
                      i === index ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* RV-04: 用語がわからない初心者向けの導線（おすすめ結果の下） */}
            <p className="text-center text-sm">
              <Link href="/prototype/glossary" className="text-emerald-700 hover:underline">
                📖 用語説明はこちら（ホエイ？WPI？という方へ）
              </Link>
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

export default function RecommendPage() {
  return (
    <Suspense fallback={<p className="text-center py-16 text-slate-500">読み込み中…</p>}>
      <RecommendContent />
    </Suspense>
  );
}
