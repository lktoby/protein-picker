// ============================================================
// F-01 おすすめ条件の選択 / F-02 おすすめ商品の提示
// 根拠: docs/03-design/api-spec.md §4-1（採点アルゴリズム）・§4-2（理由文の生成規則）
//
// 採点方式は「ローカルのルールベース」に決定している（api-spec.md §4-1）。
// 外部 AI API を使わない理由の 1 つが「決定的で単体テストが書けること」なので、
// この関数は副作用と乱数を持たない純関数として保つ。
// ============================================================
import { formatYen, lowestPrice, pricePerGram } from "./pricing";
import {
  PREFERENCE_LABELS,
  PROTEIN_TYPE_LABELS,
  PURPOSE_LABELS,
  TIMING_LABELS,
  type Preference,
  type Product,
  type ProteinType,
  type Purpose,
  type Timing,
} from "./types";

export type RecommendCriteria = {
  purpose: Purpose;
  timing: Timing;
  prefs: Preference[];
};

export type Recommendation = {
  rank: number;
  product: Product;
  /** 一致した条件の表示ラベル（「✓ 一致した条件」チップに使う。RV-09） */
  matches: string[];
  /** 1 行のおすすめ理由（RV-09） */
  reason: string;
};

/** 採点の重み（api-spec.md §4-1 手順2） */
const SCORE_PURPOSE = 30;
const SCORE_TIMING = 20;
const SCORE_PREFERENCE = 15;
const SCORE_HIGH_PROTEIN = 8;
const HIGH_PROTEIN_THRESHOLD = 85;

/** 価格評価の係数（api-spec.md §4-1 手順2d。サンプルデータの価格帯に合わせて決めた値） */
const ECONOMY_BASE_PPG = 5.2;
const ECONOMY_FACTOR = 8;
const ECONOMY_MAX = 20;
const AFFORDABILITY_BASE_PRICE = 4200;
const AFFORDABILITY_DIVISOR = 350;
const AFFORDABILITY_LIMIT = 8;

/** 最大表示件数（ui-spec.md §2） */
const MAX_RESULTS = 5;

/** 種類 × タイミングの補足文（api-spec.md §4-2） */
const TYPE_TIMING_NOTES: Partial<Record<`${ProteinType}:${Timing}`, string>> = {
  "whey:post_workout": "運動後に素早く吸収されるホエイ",
  "wpi:post_workout": "運動後の吸収が速い高純度WPI",
  "casein:before_sleep": "就寝前にゆっくり長く吸収されるカゼイン",
  "soy:snack": "腹持ちがよく間食にぴったりのソイ",
  "soy:morning": "朝にうれしい植物性のソイ",
};

/** こだわり（価格以外）が一致したときの理由文（api-spec.md §4-2） */
const PREFERENCE_REASONS: Partial<Record<Preference, string>> = {
  lactose_free: "乳糖を抑えているのでお腹にやさしい",
  vegan: "100%植物性",
  low_sugar: "低糖質",
  domestic: "国内製造で安心",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type Scored = {
  product: Product;
  score: number;
  matches: string[];
  reason: string;
  pricePerGram: number;
};

function scoreProduct(criteria: RecommendCriteria, product: Product): Scored | null {
  let score = 0;
  const matches: string[] = [];
  const reasons: string[] = [];

  // 手順2-a: 目的の一致
  if (product.purposes.includes(criteria.purpose)) {
    score += SCORE_PURPOSE;
    matches.push(PURPOSE_LABELS[criteria.purpose]);
    reasons.push(`「${PURPOSE_LABELS[criteria.purpose]}」にぴったり`);
  }

  // 手順2-b: タイミングの一致
  if (product.timings.includes(criteria.timing)) {
    score += SCORE_TIMING;
    matches.push(TIMING_LABELS[criteria.timing]);
    const note = TYPE_TIMING_NOTES[`${product.type}:${criteria.timing}`];
    reasons.push(note ?? `${TIMING_LABELS[criteria.timing]}の一杯に合う`);
  }

  // 手順2-c / 2-d: こだわりの評価
  const ppg = pricePerGram(product);
  const total = lowestPrice(product);

  for (const pref of criteria.prefs) {
    if (pref === "low_price") {
      // RV-09: 「価格の安さ重視」はタグの有無ではなく実際の価格で総合評価する。
      // 1g あたりが安いほど加点し、総額が高い商品は affordability が負になって下がる。
      const economy = clamp((ECONOMY_BASE_PPG - ppg) * ECONOMY_FACTOR, 0, ECONOMY_MAX);
      const affordability = clamp(
        (AFFORDABILITY_BASE_PRICE - total) / AFFORDABILITY_DIVISOR,
        -AFFORDABILITY_LIMIT,
        AFFORDABILITY_LIMIT,
      );
      score += economy + affordability;
      if (economy > 0) {
        matches.push(PREFERENCE_LABELS.low_price);
        reasons.push(
          `1gあたり約${ppg.toFixed(1)}円・総額 ${formatYen(total)}で価格重視にマッチ`,
        );
      }
      continue;
    }

    if (product.preferences.includes(pref)) {
      score += SCORE_PREFERENCE;
      matches.push(PREFERENCE_LABELS[pref]);
      const reason = PREFERENCE_REASONS[pref];
      if (reason) reasons.push(reason);
    }
  }

  // 手順2-e: 高含有の加点
  if (product.proteinContent >= HIGH_PROTEIN_THRESHOLD) {
    score += SCORE_HIGH_PROTEIN;
    reasons.push(`タンパク質含有率${product.proteinContent}%の高含有`);
  }

  // 手順3: 条件に何も響かなかった商品は候補から外す
  if (score <= 0) return null;

  return {
    product,
    score,
    matches,
    // 断片は先頭 3 つまでを「。」で連結し、末尾に「。」を付ける（api-spec.md §4-2）
    reason: `${reasons.slice(0, 3).join("。")}。`,
    pricePerGram: ppg,
  };
}

/**
 * 条件に合う商品をおすすめ順に返す。
 * スコアは返さない（利用者に見せる情報ではないため。api-spec.md §4）。
 */
export function recommend(criteria: RecommendCriteria, products: Product[]): Recommendation[] {
  // 手順1: 乳糖不耐症対応のハードフィルタ（減点ではなく除外。ui-spec.md §2）
  const candidates = criteria.prefs.includes("lactose_free")
    ? products.filter((p) => p.preferences.includes("lactose_free"))
    : products;

  const scored = candidates
    .map((product) => scoreProduct(criteria, product))
    .filter((s): s is Scored => s !== null);

  // 手順4: スコア降順 → 1g あたり価格の昇順 → 商品名・フレーバーの昇順（結果を安定させる）
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.pricePerGram !== b.pricePerGram) return a.pricePerGram - b.pricePerGram;
    const byName = a.product.name.localeCompare(b.product.name, "ja");
    if (byName !== 0) return byName;
    return a.product.flavor.localeCompare(b.product.flavor, "ja");
  });

  // 手順5: 上位 5 件に rank を振る
  return scored.slice(0, MAX_RESULTS).map((s, index) => ({
    rank: index + 1,
    product: s.product,
    matches: s.matches,
    reason: s.reason,
  }));
}

/** 用語説明ページ・バッジで使う種類のラベル */
export function proteinTypeLabel(type: ProteinType): string {
  return PROTEIN_TYPE_LABELS[type];
}
