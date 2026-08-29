// ============================================================
// 診断条件の URL クエリ（RV-02 復元・RV-15 不正リンクの通知）と
// 遷移元パス（from）の検証（RV-02・RV-12）
// 根拠: docs/02-prototype/ui-spec.md §2・§3・§4、docs/03-design/api-spec.md §4
// ============================================================
import {
  PREFERENCES,
  PURPOSES,
  TIMINGS,
  type Preference,
  type Purpose,
  type Timing,
} from "@/server/domain/types";
import type { RecommendCriteria } from "@/server/domain/recommendation";

/** 診断結果ページのパス。from の検証にも使う */
export const RECOMMEND_PATH = "/recommend";

export type ParseCriteriaResult =
  /** 条件が指定されていない初期表示（エラーではない） */
  | { status: "empty" }
  /** 条件を復元できた */
  | { status: "valid"; criteria: RecommendCriteria }
  /** 条件が指定されているが値が不正。黙って無視せず利用者に通知する（RV-15） */
  | { status: "invalid" };

/**
 * URL クエリから診断条件を復元する。
 * 不正な値は「無視して全件表示」ではなく `invalid` として返し、画面側で通知させる（RV-15）。
 */
export function parseCriteria(params: URLSearchParams): ParseCriteriaResult {
  const purpose = params.get("purpose");
  const timing = params.get("timing");
  const prefsRaw = params.get("prefs");

  // 何も指定されていなければ初期表示
  if (purpose === null && timing === null && prefsRaw === null) {
    return { status: "empty" };
  }

  if (!PURPOSES.includes(purpose as Purpose) || !TIMINGS.includes(timing as Timing)) {
    return { status: "invalid" };
  }

  const prefs: Preference[] = [];
  if (prefsRaw !== null && prefsRaw !== "") {
    for (const raw of prefsRaw.split(",")) {
      if (!PREFERENCES.includes(raw as Preference)) {
        // 未知の値を黙って捨てない（RV-15）
        return { status: "invalid" };
      }
      prefs.push(raw as Preference);
    }
  }

  return {
    status: "valid",
    criteria: { purpose: purpose as Purpose, timing: timing as Timing, prefs },
  };
}

/** 診断条件を URL クエリ文字列に直す（RV-02: 条件を URL に保持して復元できるようにする） */
export function buildCriteriaQuery(criteria: RecommendCriteria): string {
  const params = new URLSearchParams({
    purpose: criteria.purpose,
    timing: criteria.timing,
  });
  if (criteria.prefs.length > 0) {
    params.set("prefs", criteria.prefs.join(","));
  }
  return params.toString();
}

/** 診断結果に戻るための URL（RV-02・RV-12 で画面間を引き回す値） */
export function buildRecommendUrl(criteria: RecommendCriteria): string {
  return `${RECOMMEND_PATH}?${buildCriteriaQuery(criteria)}`;
}

/**
 * `from` パラメータが「自サイトの診断結果ページ」を指しているかを検証する。
 * 外部 URL・プロトコル相対 URL を弾き、オープンリダイレクトを防ぐ（RV-02・RV-12）。
 */
export function isSafeRecommendPath(from: string | null | undefined): boolean {
  if (!from) return false;
  // "//evil.example.com" のようなプロトコル相対 URL を拒否する
  if (from.startsWith("//")) return false;
  // 「/recommend」そのもの、または「/recommend?...」だけを許可する（前方一致の誤判定を防ぐ）
  return from === RECOMMEND_PATH || from.startsWith(`${RECOMMEND_PATH}?`);
}
