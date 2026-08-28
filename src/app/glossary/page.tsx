// ============================================================
// 用語説明 `/glossary`（RV-04 / F-02 の補助）
// 根拠: docs/02-prototype/ui-spec.md §10、docs/03-design/screen-flow.md §5-8
// 初心者が用語・数値の意味で置き去りにならないための独立ページ。
// ============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PROTEIN_TYPE_LABELS } from "@/server/domain/types";

export const metadata: Metadata = {
  title: "用語説明 | プロテインえらび",
  description:
    "プロテインの種類（ホエイ・WPI・カゼイン・ソイ・ミックス）、タンパク質含有率と1gあたり価格の見方、乳糖不耐症について、はじめての人向けに説明します。",
};

/** プロテインの種類 5 つ。それぞれ 1〜2 行の説明 ＋ 「こんな人に」の一言（ui-spec.md §10） */
const PROTEIN_TYPE_GUIDE = [
  {
    label: PROTEIN_TYPE_LABELS.whey,
    description:
      "牛乳のタンパク質から作られる、いちばん一般的なタイプです。体への吸収が速く、価格と品質のバランスがとれています。",
    forWhom: "はじめての1袋を選びたい人、運動後に飲みたい人",
  },
  {
    label: PROTEIN_TYPE_LABELS.wpi,
    description:
      "ホエイをさらに精製して、乳糖（牛乳の糖）と脂肪を減らしたタイプです。タンパク質含有率が高く、そのぶん価格も高めになります。",
    forWhom: "牛乳でおなかがゆるくなる人、含有率をできるだけ高くしたい人",
  },
  {
    label: PROTEIN_TYPE_LABELS.casein,
    description:
      "同じ牛乳由来ですが、ホエイよりゆっくり時間をかけて吸収されます。満腹感が続きやすいのが特徴です。",
    forWhom: "就寝前に飲みたい人、間食のかわりにしたい人",
  },
  {
    label: PROTEIN_TYPE_LABELS.soy,
    description:
      "大豆から作られる植物性のタイプです。乳糖を含まず、動物性の原料を避けたい人にも選べます。",
    forWhom: "植物性（ヴィーガン対応）を選びたい人、ダイエット中の人",
  },
  {
    label: PROTEIN_TYPE_LABELS.mix,
    description:
      "ホエイ＋ソイなど複数の原料を組み合わせたバランス型です。吸収の速さの異なる原料が混ざっています。",
    forWhom: "どれを選べばよいか決めきれない人、家族で分けて飲みたい人",
  },
] as const;

export default function GlossaryPage() {
  return (
    // 外枠（main・余白）は layout.tsx が持つ。読み物なので本文幅だけ狭める
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">用語説明</h1>
      <p className="mt-2 leading-relaxed text-muted-foreground">
        プロテイン選びで出てくる言葉と数字を、はじめての人向けにまとめました。
        おすすめ診断や商品一覧でわからない言葉が出てきたら、このページに戻ってきてください。
      </p>

      {/* 1. プロテインの種類 5 つ */}
      <section className="mt-10">
        <h2 className="text-lg font-bold">プロテインの種類</h2>
        <ul className="mt-3 space-y-3">
          {PROTEIN_TYPE_GUIDE.map((item) => (
            <li key={item.label}>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-bold">{item.label}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-bold">こんな人に:</span> {item.forWhom}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* 2. 数値の見方 */}
      <section className="mt-10">
        <h2 className="text-lg font-bold">数値の見方</h2>
        <dl className="mt-3 space-y-3">
          <Card>
            <CardContent className="p-4">
              <dt className="font-bold">タンパク質含有率</dt>
              <dd className="mt-1 space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p>
                  粉 100g のうち何 g がタンパク質かを表す割合です。
                  同じ量を飲んだときに、どれだけタンパク質がとれるかの目安になります。
                </p>
                <p>
                  <span className="font-bold text-foreground">65〜75% が一般的</span>で、
                  <span className="font-bold text-foreground">85% 以上は高純度</span>
                  （WPI など、精製に手間をかけたもの）です。含有率が高いほど価格も上がりやすくなります。
                </p>
              </dd>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <dt className="font-bold">1gあたり価格（送料込み）</dt>
              <dd className="mt-1 space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p>
                  総額を内容量で割った金額です。700g と 3kg のように内容量が違う商品でも、
                  1gあたりに直せば「どちらが割安か」を公平に比べられます。
                </p>
                <p>
                  このアプリの価格はすべて送料込みなので、1gあたり価格も送料を含んで計算しています。
                  <span className="font-bold text-foreground">目安は 3〜4円台が標準的</span>で、
                  3円前後なら割安、6円を超えると高価格帯（高純度の WPI などが該当します）です。
                </p>
              </dd>
            </CardContent>
          </Card>
        </dl>
      </section>

      {/* 3. 乳糖不耐症 */}
      <section className="mt-10">
        <h2 className="text-lg font-bold">乳糖不耐症（にゅうとうふたいしょう）</h2>
        <Card className="mt-3">
          <CardContent className="space-y-2 p-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              牛乳に含まれる糖（乳糖・ラクトース）をうまく消化できず、
              牛乳や乳製品でおなかがゴロゴロしたり、下しやすくなる体質のことです。
              日本人には比較的多いといわれます。
            </p>
            <p>
              プロテインでは、牛乳由来のホエイ・カゼインに乳糖が残っていることがあります。
              乳糖が気になるときは、乳糖を減らした{" "}
              <span className="font-bold text-foreground">{PROTEIN_TYPE_LABELS.wpi}</span> か、
              そもそも乳糖を含まない{" "}
              <span className="font-bold text-foreground">{PROTEIN_TYPE_LABELS.soy}</span>{" "}
              が向いています。
            </p>
            <p>
              <span className="font-bold text-foreground">診断での絞り込み方:</span>{" "}
              おすすめ診断の 3 つめの質問「こだわりはありますか？」で
              「乳糖不耐症対応（乳糖を抑えたもの）」を選んでください。
              対応していない商品は、おすすめから除外されます。
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 4. 医学的助言ではない旨の注記（ui-spec.md §10） */}
      <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
        ※ このページは商品を選ぶための一般的な参考情報で、医学的な助言ではありません。
        体質・アレルギー・持病・服薬などで不安がある場合は、医師・薬剤師にご相談ください。
      </p>

      {/* 5. 読んだ後に行動へ戻す導線（ui-spec.md §10） */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/recommend">おすすめ診断をやってみる</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/products">商品をさがす</Link>
        </Button>
      </div>
    </div>
  );
}
