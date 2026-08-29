// ============================================================
// F-01 おすすめ条件の選択 / F-02 おすすめ商品の提示
// 根拠: docs/03-design/api-spec.md §4-1（採点アルゴリズム）・§4-2（理由文の生成規則）
//       docs/02-prototype/ui-spec.md §2（RV-09 順位の根拠・価格の総合評価）
// ============================================================
import { describe, expect, it } from "vitest";
import { recommend } from "./recommendation";
import type { Preference, Product, ProteinType, Purpose, Shop, Timing } from "./types";

const shop = (shippingFee: number, name = "ショップ"): Shop => ({
  id: `s-${name}-${shippingFee}`,
  name,
  shippingFee,
  contactEmail: "s@example.com",
  contactPhone: "0120-000-000",
});

/** 総額と内容量を指定して商品を作る（採点は 1g あたり価格と総額に依存するため） */
function makeProduct(opts: {
  id: string;
  totalPrice: number;
  weightG?: number;
  proteinContent?: number;
  type?: ProteinType;
  purposes?: Purpose[];
  timings?: Timing[];
  preferences?: Preference[];
  name?: string;
  flavor?: string;
}): Product {
  return {
    id: opts.id,
    name: opts.name ?? `商品${opts.id}`,
    brand: "ブランド",
    type: opts.type ?? "whey",
    flavor: opts.flavor ?? "プレーン",
    weightG: opts.weightG ?? 1000,
    proteinContent: opts.proteinContent ?? 75,
    description: "説明",
    imageUrl: "/i.jpg",
    purposes: opts.purposes ?? [],
    timings: opts.timings ?? [],
    preferences: opts.preferences ?? [],
    // 送料 0 のショップにして、総額をそのまま itemPrice で表現する
    shopOffers: [{ shop: shop(0), itemPrice: opts.totalPrice }],
    storeOffers: [],
  };
}

const baseCriteria = { purpose: "muscle" as Purpose, timing: "post_workout" as Timing, prefs: [] };

describe("recommend — 条件との一致度で採点する（api-spec.md §4-1 手順2）", () => {
  it("TC-R01 正常系: 目的とタイミングの両方が一致する商品が最上位になる", () => {
    const both = makeProduct({
      id: "both",
      totalPrice: 4000,
      purposes: ["muscle"],
      timings: ["post_workout"],
    });
    const purposeOnly = makeProduct({ id: "purpose", totalPrice: 4000, purposes: ["muscle"] });
    const timingOnly = makeProduct({ id: "timing", totalPrice: 4000, timings: ["post_workout"] });

    const result = recommend(baseCriteria, [timingOnly, purposeOnly, both]);
    expect(result.map((r) => r.product.id)).toEqual(["both", "purpose", "timing"]);
  });

  it("TC-R02 正常系: 目的の一致（+30）はタイミングの一致（+20）より重い", () => {
    const purposeOnly = makeProduct({ id: "purpose", totalPrice: 4000, purposes: ["muscle"] });
    const timingOnly = makeProduct({ id: "timing", totalPrice: 4000, timings: ["post_workout"] });
    const result = recommend(baseCriteria, [timingOnly, purposeOnly]);
    expect(result[0].product.id).toBe("purpose");
  });

  it("TC-R17 異常系: 条件にまったく一致しない商品は結果に含めない", () => {
    const noMatch = makeProduct({ id: "none", totalPrice: 4000, purposes: ["diet"] });
    const result = recommend(baseCriteria, [noMatch]);
    expect(result).toEqual([]);
  });

  it("TC-R18 異常系: 一致する商品が 1 つも無ければ空配列を返す（エラーにしない）", () => {
    expect(recommend(baseCriteria, [])).toEqual([]);
  });

  it("TC-R22 正常系: スコアは返さない（内部指標を公開しない / api-spec.md §4）", () => {
    const p = makeProduct({ id: "p", totalPrice: 4000, purposes: ["muscle"] });
    const [item] = recommend(baseCriteria, [p]);
    expect(item).not.toHaveProperty("score");
  });
});

describe("recommend — 乳糖不耐症対応のハードフィルタ（ui-spec.md §2 / api-spec.md §4-1 手順1）", () => {
  it("TC-R07 正常系: 乳糖不耐症対応を選ぶと、非対応商品は結果から除外される", () => {
    const ok = makeProduct({
      id: "ok",
      totalPrice: 4000,
      purposes: ["muscle"],
      preferences: ["lactose_free"],
    });
    const ng = makeProduct({ id: "ng", totalPrice: 4000, purposes: ["muscle"], preferences: [] });

    const result = recommend({ ...baseCriteria, prefs: ["lactose_free"] }, [ok, ng]);
    expect(result.map((r) => r.product.id)).toEqual(["ok"]);
  });

  it("TC-R07b 境界値: 目的・タイミングが一致していても、非対応なら除外される（減点ではなく除外）", () => {
    const ng = makeProduct({
      id: "ng",
      totalPrice: 4000,
      purposes: ["muscle"],
      timings: ["post_workout"],
      proteinContent: 90,
    });
    const result = recommend({ ...baseCriteria, prefs: ["lactose_free"] }, [ng]);
    expect(result).toEqual([]);
  });
});

describe("recommend — 価格の安さ重視は実際の価格で評価する（RV-09 / api-spec.md §4-1 手順2d）", () => {
  it("TC-R09 正常系: 総額が同じなら 1g あたりが安い商品が高く評価される", () => {
    const cheapPerGram = makeProduct({ id: "perGramCheap", totalPrice: 4000, weightG: 2000 });
    const expensivePerGram = makeProduct({ id: "perGramHigh", totalPrice: 4000, weightG: 1000 });
    const result = recommend({ ...baseCriteria, prefs: ["low_price"] }, [
      expensivePerGram,
      cheapPerGram,
    ]);
    expect(result[0].product.id).toBe("perGramCheap");
  });

  it("TC-R10 正常系: 1g あたりが同じなら総額が高い商品は評価が下がる", () => {
    const lowTotal = makeProduct({ id: "lowTotal", totalPrice: 4000, weightG: 1000 });
    const highTotal = makeProduct({ id: "highTotal", totalPrice: 8000, weightG: 2000 });
    const result = recommend({ ...baseCriteria, prefs: ["low_price"] }, [highTotal, lowTotal]);
    expect(result[0].product.id).toBe("lowTotal");
  });

  it("TC-R09b 正常系: low_price は「タグの有無」では加点されない（実価格で決まる）", () => {
    // タグを持つが高額な商品より、タグを持たない安価な商品が上に来る
    const taggedButExpensive = makeProduct({
      id: "tagged",
      totalPrice: 9000,
      weightG: 1000,
      preferences: ["low_price"],
    });
    const untaggedButCheap = makeProduct({ id: "cheap", totalPrice: 2500, weightG: 1000 });
    const result = recommend({ ...baseCriteria, prefs: ["low_price"] }, [
      taggedButExpensive,
      untaggedButCheap,
    ]);
    expect(result[0].product.id).toBe("cheap");
  });

  it("TC-R11 正常系: 理由文に 1g あたり価格と総額の両方を明記する（RV-09）", () => {
    const p = makeProduct({ id: "p", totalPrice: 3000, weightG: 1000, purposes: ["muscle"] });
    const [item] = recommend({ ...baseCriteria, prefs: ["low_price"] }, [p]);
    expect(item.reason).toContain("1gあたり");
    expect(item.reason).toContain("総額 3,000円");
  });
});

describe("recommend — タンパク質含有率の加点（api-spec.md §4-1 手順2e）", () => {
  it("TC-R13 境界値: 含有率 85% は加点対象（>= の境界）", () => {
    const high = makeProduct({ id: "high", totalPrice: 4000, proteinContent: 85 });
    const [item] = recommend(baseCriteria, [
      makeProduct({ id: "base", totalPrice: 4000, purposes: ["muscle"] }),
      high,
    ]);
    // base(30) vs high(8) → base が上。high が結果に含まれること自体が加点の証拠
    expect(item.product.id).toBe("base");
    const ids = recommend(baseCriteria, [high]).map((r) => r.product.id);
    expect(ids).toEqual(["high"]);
  });

  it("TC-R14 境界値: 含有率 84% は加点されず、条件に一致しなければ除外される", () => {
    const notHigh = makeProduct({ id: "notHigh", totalPrice: 4000, proteinContent: 84 });
    expect(recommend(baseCriteria, [notHigh])).toEqual([]);
  });

  it("TC-R12 正常系: 高含有の商品は理由文に含有率が入る", () => {
    const p = makeProduct({
      id: "p",
      totalPrice: 4000,
      proteinContent: 90,
      purposes: ["muscle"],
    });
    const [item] = recommend(baseCriteria, [p]);
    expect(item.reason).toContain("タンパク質含有率90%");
  });
});

describe("recommend — 一致した条件のチップ（RV-09 / api-spec.md §4-2）", () => {
  it("TC-R03 正常系: 目的 → タイミング → こだわりの順にラベルが入る", () => {
    const p = makeProduct({
      id: "p",
      totalPrice: 4000,
      purposes: ["muscle"],
      timings: ["post_workout"],
      preferences: ["vegan"],
    });
    const [item] = recommend({ ...baseCriteria, prefs: ["vegan"] }, [p]);
    expect(item.matches).toEqual(["筋肉をつけたい", "運動後", "植物性（ヴィーガン対応）"]);
  });

  it("TC-R03b 正常系: 一致しなかった条件はチップに入らない", () => {
    const p = makeProduct({ id: "p", totalPrice: 4000, purposes: ["muscle"] });
    const [item] = recommend(baseCriteria, [p]);
    expect(item.matches).toEqual(["筋肉をつけたい"]);
  });
});

describe("recommend — 理由文の生成（api-spec.md §4-2）", () => {
  it("TC-R04 正常系: 「。」で終わり、断片は最大 3 つまで", () => {
    const p = makeProduct({
      id: "p",
      totalPrice: 3000,
      purposes: ["muscle"],
      timings: ["post_workout"],
      preferences: ["vegan", "low_sugar", "domestic"],
      proteinContent: 90,
    });
    const [item] = recommend(
      { ...baseCriteria, prefs: ["vegan", "low_sugar", "domestic"] },
      [p],
    );
    expect(item.reason.endsWith("。")).toBe(true);
    // 断片は「。」区切りで最大 3 つ（末尾の「。」で split すると空要素が 1 つ出る）
    expect(item.reason.split("。").filter((s) => s !== "").length).toBeLessThanOrEqual(3);
  });

  it("TC-R05 正常系: 種類×タイミングの補足がある組み合わせはその文を使う", () => {
    const p = makeProduct({
      id: "p",
      totalPrice: 4000,
      type: "whey",
      timings: ["post_workout"],
    });
    const [item] = recommend(baseCriteria, [p]);
    expect(item.reason).toContain("運動後に素早く吸収されるホエイ");
  });

  it("TC-R05b 正常系: カゼイン × 就寝前の補足が使われる", () => {
    const p = makeProduct({
      id: "p",
      totalPrice: 4000,
      type: "casein",
      timings: ["before_sleep"],
    });
    const [item] = recommend({ purpose: "muscle", timing: "before_sleep", prefs: [] }, [p]);
    expect(item.reason).toContain("就寝前にゆっくり長く吸収されるカゼイン");
  });

  it("TC-R06 正常系: 補足が無い組み合わせは「{タイミング}の一杯に合う」になる", () => {
    const p = makeProduct({
      id: "p",
      totalPrice: 4000,
      type: "mix",
      timings: ["before_sleep"],
    });
    const [item] = recommend({ purpose: "muscle", timing: "before_sleep", prefs: [] }, [p]);
    expect(item.reason).toContain("就寝前の一杯に合う");
  });

  it("TC-R08 正常系: 乳糖不耐症対応の理由文が入る", () => {
    const p = makeProduct({
      id: "p",
      totalPrice: 4000,
      preferences: ["lactose_free"],
    });
    const [item] = recommend({ ...baseCriteria, prefs: ["lactose_free"] }, [p]);
    expect(item.reason).toContain("乳糖を抑えているのでお腹にやさしい");
  });

  it("TC-R21 正常系: vegan / low_sugar / domestic それぞれの理由文が入る", () => {
    const cases: Array<[Preference, string]> = [
      ["vegan", "100%植物性"],
      ["low_sugar", "低糖質"],
      ["domestic", "国内製造で安心"],
    ];
    for (const [pref, expected] of cases) {
      const p = makeProduct({ id: pref, totalPrice: 4000, preferences: [pref] });
      const [item] = recommend({ ...baseCriteria, prefs: [pref] }, [p]);
      expect(item.reason).toContain(expected);
    }
  });
});

describe("recommend — 並び順と件数（api-spec.md §4-1 手順4・5）", () => {
  it("TC-R15 正常系: 最大 5 件までしか返さない", () => {
    const products = Array.from({ length: 8 }, (_, i) =>
      makeProduct({ id: `p${i}`, totalPrice: 4000, purposes: ["muscle"] }),
    );
    expect(recommend(baseCriteria, products)).toHaveLength(5);
  });

  it("TC-R16 正常系: rank が 1 から連番で振られる", () => {
    const products = Array.from({ length: 3 }, (_, i) =>
      makeProduct({ id: `p${i}`, totalPrice: 4000, purposes: ["muscle"] }),
    );
    expect(recommend(baseCriteria, products).map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("TC-R19 境界値: 同点なら 1g あたり価格が安い商品が上になる", () => {
    const cheap = makeProduct({
      id: "cheap",
      totalPrice: 2000,
      weightG: 1000,
      purposes: ["muscle"],
    });
    const pricey = makeProduct({
      id: "pricey",
      totalPrice: 8000,
      weightG: 1000,
      purposes: ["muscle"],
    });
    const result = recommend(baseCriteria, [pricey, cheap]);
    expect(result.map((r) => r.product.id)).toEqual(["cheap", "pricey"]);
  });

  it("TC-R20 境界値: 同点・同価格なら商品名 → フレーバーの昇順で安定する", () => {
    const b = makeProduct({
      id: "b",
      totalPrice: 4000,
      purposes: ["muscle"],
      name: "ビー",
      flavor: "ココア",
    });
    const a1 = makeProduct({
      id: "a1",
      totalPrice: 4000,
      purposes: ["muscle"],
      name: "エー",
      flavor: "バニラ",
    });
    const a2 = makeProduct({
      id: "a2",
      totalPrice: 4000,
      purposes: ["muscle"],
      name: "エー",
      flavor: "イチゴ",
    });
    const result = recommend(baseCriteria, [b, a1, a2]);
    // 名前昇順（エー → ビー）、同名はフレーバー昇順（イチゴ → バニラ）
    expect(result.map((r) => r.product.id)).toEqual(["a2", "a1", "b"]);
  });
});
