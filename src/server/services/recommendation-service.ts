// ============================================================
// F-01 おすすめ条件の選択 / F-02 おすすめ商品の提示
// 根拠: docs/03-design/api-spec.md §4
// ============================================================
import { recommend, type RecommendCriteria } from "@/server/domain/recommendation";
import {
  PREFERENCE_LABELS,
  PURPOSE_LABELS,
  TIMING_LABELS,
} from "@/server/domain/types";
import { findAllProducts } from "@/server/repositories/products";
import { toProductSummary, type ProductSummary } from "./product-service";

export type RecommendationItem = {
  rank: number;
  product: ProductSummary;
  cheapestShopName: string;
  matches: string[];
  reason: string;
};

export type RecommendationResponse = {
  criteria: {
    purpose: string;
    purposeLabel: string;
    timing: string;
    timingLabel: string;
    prefs: string[];
    prefLabels: string[];
  };
  items: RecommendationItem[];
  total: number;
};

export async function getRecommendations(
  criteria: RecommendCriteria,
): Promise<RecommendationResponse> {
  const products = await findAllProducts();
  const results = recommend(criteria, products);

  return {
    criteria: {
      purpose: criteria.purpose,
      purposeLabel: PURPOSE_LABELS[criteria.purpose],
      timing: criteria.timing,
      timingLabel: TIMING_LABELS[criteria.timing],
      prefs: criteria.prefs,
      prefLabels: criteria.prefs.map((p) => PREFERENCE_LABELS[p]),
    },
    items: results.map((r) => {
      const summary = toProductSummary(r.product);
      return {
        rank: r.rank,
        product: summary,
        cheapestShopName: summary.cheapestSourceName,
        matches: r.matches,
        reason: r.reason,
      };
    }),
    total: results.length,
  };
}
