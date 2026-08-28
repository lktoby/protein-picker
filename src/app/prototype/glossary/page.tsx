// RV-04: 初心者向け用語説明ページ（独立ページ方式・questions.md ラウンド2 Q-04 で確定）
// ナビの「用語説明」ボタンと、おすすめ結果下の「用語説明はこちら」リンクから遷移する。

import Link from "next/link";

const TYPES = [
  {
    name: "ホエイ",
    emoji: "🥛",
    desc: "牛乳由来。吸収が速く、運動後の定番。迷ったらまずこれ。",
    for: "こんな人に: 筋トレ後にすぐ栄養を摂りたい人・はじめての1本",
  },
  {
    name: "WPI（ホエイアイソレート）",
    emoji: "✨",
    desc: "ホエイをさらに精製し、乳糖や脂質を除いた高純度タイプ。タンパク質含有率が高く、価格もやや高め。",
    for: "こんな人に: 牛乳でお腹がゴロゴロしやすい人・成分にこだわる人",
  },
  {
    name: "カゼイン",
    emoji: "🌙",
    desc: "牛乳由来。ゆっくり長く吸収されるのが特徴。腹持ちがよい。",
    for: "こんな人に: 就寝前に飲みたい人・間食を置き換えたい人",
  },
  {
    name: "ソイ",
    emoji: "🌱",
    desc: "大豆由来の植物性。ゆっくり吸収・腹持ちがよい。乳成分を含まない。",
    for: "こんな人に: ダイエット中の人・植物性にこだわる人・乳糖不耐症の人",
  },
  {
    name: "ミックス",
    emoji: "🔄",
    desc: "ホエイ＋ソイなど複数を配合したバランス型。ビタミン等を加えた製品も多い。",
    for: "こんな人に: 毎日の栄養補給として家族で飲みたい人",
  },
];

export default function GlossaryPage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">📖 用語説明</h1>
        <p className="text-slate-600 text-sm mt-1">
          プロテイン選びに出てくる言葉と数値の見方を、初心者向けにまとめました。
        </p>
      </div>

      {/* プロテインの種類 */}
      <section className="space-y-3">
        <h2 className="font-bold text-lg">プロテインの種類</h2>
        <div className="space-y-3">
          {TYPES.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="font-bold">
                {t.emoji} {t.name}
              </div>
              <p className="text-sm text-slate-600 mt-1">{t.desc}</p>
              <p className="text-sm text-emerald-700 mt-1">{t.for}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 数値の見方 */}
      <section className="space-y-3">
        <h2 className="font-bold text-lg">数値の見方</h2>
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="font-bold">💪 タンパク質含有率（%）</div>
            <p className="text-sm text-slate-600 mt-1">
              商品の重さのうち、どれだけがタンパク質かの割合。<b>65〜75% が一般的</b>で、
              <b>85% 以上は高純度（WPI に多い）</b>。高いほど同じ量で多くのタンパク質が摂れますが、価格も上がる傾向があります。
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="font-bold">💰 1g あたりの価格</div>
            <p className="text-sm text-slate-600 mt-1">
              総額を内容量で割った値段。<b>容量が違う商品を公平に比べるための物差し</b>です。
              このアプリの商品ではおおよそ <b>3円台前半＝お手頃、4〜5円台＝標準、6円以上＝高め</b> が目安です（表示価格はすべて送料込み）。
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="font-bold">🥛 乳糖不耐症（にゅうとうふたいしょう）</div>
            <p className="text-sm text-slate-600 mt-1">
              牛乳などに含まれる「乳糖」をうまく消化できず、お腹がゴロゴロしやすい体質のこと。
              心当たりがある人は、乳糖を抑えた <b>WPI</b> や乳成分を含まない <b>ソイ</b> がおすすめです。
              おすすめ診断で「乳糖不耐症対応」を選ぶと、対応商品だけに絞られます。
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/prototype/recommend"
          className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
        >
          🎯 おすすめ診断をやってみる
        </Link>
        <Link
          href="/prototype/products"
          className="px-6 py-3 rounded-xl bg-white border border-slate-300 font-bold hover:border-emerald-400 transition"
        >
          商品をさがす
        </Link>
      </div>

      <p className="text-xs text-slate-400">
        ※ 本ページの説明・目安はデモ用の一般的な情報であり、医学的助言ではありません。
      </p>
    </div>
  );
}
