// ============================================================
// 診断条件の URL クエリ（RV-02 復元・RV-15 不正リンクの通知）と
// 遷移元パス（from）の安全性検証（RV-02・RV-12）
// 根拠: docs/02-prototype/ui-spec.md §2・§3・§4、docs/03-design/api-spec.md §4
// ============================================================
import { describe, expect, it } from "vitest";
import { buildCriteriaQuery, isSafeRecommendPath, parseCriteria } from "./criteria";

describe("parseCriteria — URL クエリから診断条件を復元する（RV-02）", () => {
  it("TC-C01 正常系: 妥当なクエリを条件として復元できる", () => {
    const result = parseCriteria(new URLSearchParams("purpose=muscle&timing=post_workout"));
    expect(result).toEqual({
      status: "valid",
      criteria: { purpose: "muscle", timing: "post_workout", prefs: [] },
    });
  });

  it("TC-C02 正常系: prefs が無ければ空配列になる", () => {
    const result = parseCriteria(new URLSearchParams("purpose=diet&timing=morning"));
    expect(result.status).toBe("valid");
    if (result.status === "valid") expect(result.criteria.prefs).toEqual([]);
  });

  it("TC-C03 正常系: prefs のカンマ区切りを復元できる", () => {
    const result = parseCriteria(
      new URLSearchParams("purpose=diet&timing=morning&prefs=lactose_free,low_sugar"),
    );
    expect(result.status).toBe("valid");
    if (result.status === "valid") {
      expect(result.criteria.prefs).toEqual(["lactose_free", "low_sugar"]);
    }
  });

  it("TC-C06 正常系: パラメータが無い初期表示は「未指定」を返す（エラーではない）", () => {
    expect(parseCriteria(new URLSearchParams("")).status).toBe("empty");
  });

  it("TC-C04 異常系: 存在しない目的は不正として扱う（黙って無視しない / RV-15）", () => {
    const result = parseCriteria(new URLSearchParams("purpose=xxx&timing=post_workout"));
    expect(result.status).toBe("invalid");
  });

  it("TC-C05 異常系: 存在しないタイミングは不正として扱う", () => {
    expect(parseCriteria(new URLSearchParams("purpose=muscle&timing=xxx")).status).toBe("invalid");
  });

  it("TC-C05b 異常系: 目的だけ指定されタイミングが欠けている場合も不正", () => {
    expect(parseCriteria(new URLSearchParams("purpose=muscle")).status).toBe("invalid");
  });

  it("TC-C07 異常系: prefs に未知の値が混ざっていれば不正（RV-15）", () => {
    const result = parseCriteria(
      new URLSearchParams("purpose=muscle&timing=post_workout&prefs=lactose_free,unknown"),
    );
    expect(result.status).toBe("invalid");
  });
});

describe("buildCriteriaQuery — 条件を URL クエリに直す（RV-02）", () => {
  it("TC-C08 正常系: parseCriteria で往復できる", () => {
    const criteria = {
      purpose: "muscle" as const,
      timing: "post_workout" as const,
      prefs: ["low_price" as const],
    };
    const query = buildCriteriaQuery(criteria);
    const parsed = parseCriteria(new URLSearchParams(query));
    expect(parsed).toEqual({ status: "valid", criteria });
  });

  it("TC-C09 境界値: prefs が空なら prefs パラメータを付けない", () => {
    const query = buildCriteriaQuery({ purpose: "diet", timing: "snack", prefs: [] });
    expect(query).not.toContain("prefs");
  });
});

describe("isSafeRecommendPath — 遷移元パスの検証（RV-02・RV-12 / オープンリダイレクト対策）", () => {
  it("TC-C10 正常系: /recommend で始まる自サイト内のパスは許可する", () => {
    expect(isSafeRecommendPath("/recommend?purpose=muscle&timing=morning")).toBe(true);
    expect(isSafeRecommendPath("/recommend")).toBe(true);
  });

  it("TC-C11 異常系: 外部 URL は拒否する", () => {
    expect(isSafeRecommendPath("https://evil.example.com/recommend")).toBe(false);
  });

  it("TC-C12 異常系: プロトコル相対 URL は拒否する", () => {
    expect(isSafeRecommendPath("//evil.example.com/recommend")).toBe(false);
  });

  it("TC-C13 異常系: 診断以外のパスは拒否する", () => {
    expect(isSafeRecommendPath("/orders")).toBe(false);
    expect(isSafeRecommendPath("/products/abc")).toBe(false);
  });

  it("TC-C14 境界値: null・空文字は拒否する", () => {
    expect(isSafeRecommendPath(null)).toBe(false);
    expect(isSafeRecommendPath("")).toBe(false);
  });

  it("TC-C15 異常系: 「/recommend」を含むだけの別パスは拒否する（前方一致で判定する）", () => {
    expect(isSafeRecommendPath("/evil/recommend")).toBe(false);
    expect(isSafeRecommendPath("/recommendation-trap")).toBe(false);
  });
});
