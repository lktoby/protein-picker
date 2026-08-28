// ============================================================
// F-04 商品情報の一気見 / F-05 実店舗情報 / F-06 購入手続き の価格計算
// 根拠: docs/02-prototype/ui-spec.md §6（価格表示ルール）、docs/03-design/db-design.md §7（導出値）
// ============================================================
import { describe, expect, it } from "vitest";
import {
  breakdownLabel,
  cheapestSourceName,
  formatYen,
  lowestPrice,
  orderTotal,
  pricePerGram,
  shippingNote,
  shopTotalPrice,
  sortShopOffersByTotal,
} from "./pricing";
import type { Product, Shop, Store } from "./types";

const shop = (id: string, shippingFee: number): Shop => ({
  id,
  name: `ショップ${id}`,
  shippingFee,
  contactEmail: `${id}@example.com`,
  contactPhone: "0120-000-000",
});

const store = (id: string): Store => ({
  id,
  name: `店舗${id}`,
  access: "駅から徒歩5分",
  phone: "03-0000-0000",
  businessHours: "10:00-21:00",
});

/** テスト用の商品。販売チャネルはテストごとに差し替える */
const product = (overrides: Partial<Product> = {}): Product => ({
  id: "p1",
  name: "テストプロテイン",
  brand: "テストブランド",
  type: "whey",
  flavor: "プレーン",
  weightG: 1000,
  proteinContent: 75,
  description: "説明",
  imageUrl: "/images/test.jpg",
  purposes: ["muscle"],
  timings: ["post_workout"],
  preferences: [],
  shopOffers: [{ shop: shop("a", 500), itemPrice: 3480 }],
  storeOffers: [],
  ...overrides,
});

describe("shopTotalPrice — ネット通販の総額（ui-spec.md §6）", () => {
  it("TC-P01 正常系: 総額 = 商品代金 + 送料", () => {
    expect(shopTotalPrice({ shop: shop("a", 500), itemPrice: 3480 })).toBe(3980);
  });

  it("TC-P02 境界値: 送料 0 円なら総額は商品代金と同じ", () => {
    expect(shopTotalPrice({ shop: shop("a", 0), itemPrice: 4180 })).toBe(4180);
  });
});

describe("lowestPrice — 最安値（全チャネル・送料込み / ui-spec.md §6）", () => {
  it("TC-P03 正常系: 複数のネット通販のうち総額が最も安い値を返す", () => {
    const p = product({
      shopOffers: [
        { shop: shop("a", 500), itemPrice: 3480 }, // 総額 3980
        { shop: shop("b", 0), itemPrice: 4180 }, // 総額 4180
      ],
    });
    expect(lowestPrice(p)).toBe(3980);
  });

  it("TC-P04 境界値: 実店舗のほうが安ければ店頭価格が最安値になる", () => {
    const p = product({
      shopOffers: [{ shop: shop("a", 500), itemPrice: 3480 }], // 総額 3980
      storeOffers: [{ store: store("s1"), price: 3500 }],
    });
    expect(lowestPrice(p)).toBe(3500);
  });

  it("TC-P05 境界値: 実店舗が 0 件でもネット通販だけで最安値を求められる", () => {
    const p = product({
      shopOffers: [{ shop: shop("a", 800), itemPrice: 9000 }],
      storeOffers: [],
    });
    expect(lowestPrice(p)).toBe(9800);
  });

  it("TC-P16 異常系: 販売チャネルが 1 つも無い商品はエラーにする", () => {
    const p = product({ shopOffers: [], storeOffers: [] });
    expect(() => lowestPrice(p)).toThrow();
  });
});

describe("pricePerGram — 1g あたり価格（ui-spec.md §6）", () => {
  it("TC-P06 正常系: 最安値 / 内容量 を返す", () => {
    const p = product({
      weightG: 1000,
      shopOffers: [{ shop: shop("a", 500), itemPrice: 3480 }],
    });
    expect(pricePerGram(p)).toBeCloseTo(3.98, 2);
  });

  it("TC-P14 異常系: 内容量が 0 の商品はエラーにする（0 除算を防ぐ）", () => {
    const p = product({ weightG: 0 });
    expect(() => pricePerGram(p)).toThrow();
  });
});

describe("shippingNote — 価格に添える送料の注記（ui-spec.md §6 / RV-18①）", () => {
  it("TC-P07 正常系: 送料ありの通販が最安なら「内 送料 N円」", () => {
    const p = product({
      shopOffers: [{ shop: shop("a", 500), itemPrice: 3480 }],
    });
    expect(shippingNote(p)).toEqual({ kind: "included", fee: 500, label: "内 送料 500円" });
  });

  it("TC-P08 正常系: 送料無料の通販が最安なら「送料無料」", () => {
    const p = product({
      shopOffers: [{ shop: shop("a", 0), itemPrice: 3000 }],
    });
    expect(shippingNote(p)).toEqual({ kind: "free", fee: 0, label: "送料無料" });
  });

  it("TC-P09 正常系: 実店舗が最安なら「店頭価格・送料なし」", () => {
    const p = product({
      shopOffers: [{ shop: shop("a", 500), itemPrice: 3480 }],
      storeOffers: [{ store: store("s1"), price: 3000 }],
    });
    expect(shippingNote(p)).toEqual({ kind: "store", fee: 0, label: "店頭価格・送料なし" });
  });
});

describe("breakdownLabel — ショップ行の内訳（ui-spec.md §6 / RV-16・RV-18②）", () => {
  it("TC-P10 正常系: 「商品 3,480円 + 送料 500円」を返す（記号は半角）", () => {
    const label = breakdownLabel({ shop: shop("a", 500), itemPrice: 3480 });
    expect(label).toBe("商品 3,480円 + 送料 500円");
    // RV-18②: 金額の式に全角記号を使わない
    expect(label).not.toContain("＋");
  });

  it("TC-P11 正常系: 送料 0 円のショップは「送料無料」", () => {
    expect(breakdownLabel({ shop: shop("a", 0), itemPrice: 4180 })).toBe("送料無料");
  });
});

describe("orderTotal — 注文の合計（送料は注文単位で 1 回 / design questions.md Q-01）", () => {
  it("TC-P12 正常系: 単価 × 数量 + 送料（数量では送料を乗じない）", () => {
    expect(orderTotal({ unitItemPrice: 3480, quantity: 2, shippingFee: 500 })).toBe(7460);
  });

  it("TC-P13 境界値: 数量 1 でも送料は 1 回だけ加算する", () => {
    expect(orderTotal({ unitItemPrice: 3480, quantity: 1, shippingFee: 500 })).toBe(3980);
  });

  it("TC-P13b 境界値: 数量 5（上限）でも送料は 1 回だけ", () => {
    expect(orderTotal({ unitItemPrice: 1000, quantity: 5, shippingFee: 800 })).toBe(5800);
  });

  it("TC-P13c 境界値: 送料無料なら商品代金だけになる", () => {
    expect(orderTotal({ unitItemPrice: 1000, quantity: 3, shippingFee: 0 })).toBe(3000);
  });
});

describe("formatYen — 金額の表示整形", () => {
  it("TC-P15 正常系: 3 桁ごとに区切って「円」を付ける", () => {
    expect(formatYen(3480)).toBe("3,480円");
    expect(formatYen(500)).toBe("500円");
    expect(formatYen(1000000)).toBe("1,000,000円");
  });

  it("TC-P15b 境界値: 0 円も表示できる", () => {
    expect(formatYen(0)).toBe("0円");
  });
});

describe("cheapestSourceName — 最安値の販売元名（ui-spec.md §2 / RV-18①）", () => {
  it("TC-P17 正常系: 最安のショップ名を返す", () => {
    const p = product({
      shopOffers: [
        { shop: { ...shop("a", 500), name: "高いショップ" }, itemPrice: 5000 },
        { shop: { ...shop("b", 0), name: "安いショップ" }, itemPrice: 4000 },
      ],
    });
    expect(cheapestSourceName(p)).toBe("安いショップ");
  });

  it("TC-P18 境界値: ネット通販と実店舗が同額ならネット通販を優先する", () => {
    const p = product({
      shopOffers: [{ shop: { ...shop("a", 0), name: "通販" }, itemPrice: 3000 }],
      storeOffers: [{ store: { ...store("s1"), name: "店舗" }, price: 3000 }],
    });
    expect(cheapestSourceName(p)).toBe("通販");
  });
});

describe("sortShopOffersByTotal — ショップを総額の安い順に並べる（RV-11）", () => {
  it("TC-P19 正常系: 総額の昇順に並ぶ（送料を含めて比較する）", () => {
    const offers = [
      { shop: shop("a", 0), itemPrice: 4180 }, // 総額 4180
      { shop: shop("b", 500), itemPrice: 3480 }, // 総額 3980 ← こちらが安い
    ];
    expect(sortShopOffersByTotal(offers).map(shopTotalPrice)).toEqual([3980, 4180]);
  });

  it("TC-P20 境界値: 総額が同じならショップ名の昇順で安定する", () => {
    const offers = [
      { shop: { ...shop("z", 0), name: "ゼット" }, itemPrice: 3000 },
      { shop: { ...shop("a", 0), name: "エー" }, itemPrice: 3000 },
    ];
    expect(sortShopOffersByTotal(offers).map((o) => o.shop.name)).toEqual(["エー", "ゼット"]);
  });

  it("TC-P21 異常系: 元の配列を書き換えない（副作用がない）", () => {
    const offers = [
      { shop: shop("a", 0), itemPrice: 5000 },
      { shop: shop("b", 0), itemPrice: 1000 },
    ];
    sortShopOffersByTotal(offers);
    expect(offers[0].itemPrice).toBe(5000);
  });
});
