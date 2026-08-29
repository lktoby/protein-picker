// ============================================================
// F-03 商品検索
// 根拠: docs/02-prototype/ui-spec.md §3（商品名・ブランド名等の部分一致）
//       docs/03-design/api-spec.md §2（大文字小文字を区別しない・並び順は商品名昇順）
// ============================================================
import { describe, expect, it } from "vitest";
import { searchProducts } from "./search";
import type { Product } from "./types";

const p = (id: string, name: string, brand: string, flavor: string, type: Product["type"]) =>
  ({
    id,
    name,
    brand,
    type,
    flavor,
    weightG: 1000,
    proteinContent: 75,
    description: "説明",
    imageUrl: "/i.jpg",
    purposes: [],
    timings: [],
    preferences: [],
    shopOffers: [
      {
        shop: {
          id: "s",
          name: "S",
          shippingFee: 0,
          contactEmail: "a@example.com",
          contactPhone: "0",
        },
        itemPrice: 3000,
      },
    ],
    storeOffers: [],
  }) satisfies Product;

const products: Product[] = [
  p("1", "マッスルグロウ ホエイ100", "筋トレ堂", "チョコレート風味", "whey"),
  p("2", "ソイスリム", "グリーンフィット", "ココア風味", "soy"),
  p("3", "WPIクリア", "クリアラボ", "グレープ風味", "wpi"),
];

describe("searchProducts — 部分一致で検索する（ui-spec.md §3）", () => {
  it("TC-S01 正常系: 商品名の部分一致で引ける", () => {
    expect(searchProducts(products, "グロウ").map((x) => x.id)).toEqual(["1"]);
  });

  it("TC-S02 正常系: ブランド名の部分一致で引ける", () => {
    expect(searchProducts(products, "グリーン").map((x) => x.id)).toEqual(["2"]);
  });

  it("TC-S03 正常系: フレーバーの部分一致で引ける", () => {
    expect(searchProducts(products, "グレープ").map((x) => x.id)).toEqual(["3"]);
  });

  it("TC-S04 正常系: 種類のラベルでも引ける（「ホエイ」で whey が一致）", () => {
    expect(searchProducts(products, "ホエイ").map((x) => x.id)).toContain("1");
  });

  it("TC-S05 正常系: 大文字小文字を区別しない", () => {
    expect(searchProducts(products, "wpi").map((x) => x.id)).toEqual(["3"]);
    expect(searchProducts(products, "WPI").map((x) => x.id)).toEqual(["3"]);
  });

  it("TC-S06 境界値: 空文字列なら全件返す", () => {
    expect(searchProducts(products, "")).toHaveLength(3);
  });

  it("TC-S07 境界値: 空白のみなら全件返す", () => {
    expect(searchProducts(products, "   ")).toHaveLength(3);
  });

  it("TC-S09 正常系: 検索語の前後の空白は無視する", () => {
    expect(searchProducts(products, "  ソイ  ").map((x) => x.id)).toEqual(["2"]);
  });

  it("TC-S08 異常系: 一致する商品が無ければ空配列を返す", () => {
    expect(searchProducts(products, "存在しない商品名")).toEqual([]);
  });

  it("TC-S10 正常系: 並び順は商品名 → フレーバーの昇順で安定する（api-spec.md §2）", () => {
    const unsorted = [
      p("b", "ビー", "ブランド", "バニラ", "whey"),
      p("a2", "エー", "ブランド", "ミルク", "whey"),
      p("a1", "エー", "ブランド", "イチゴ", "whey"),
    ];
    expect(searchProducts(unsorted, "").map((x) => x.id)).toEqual(["a1", "a2", "b"]);
  });

  it("TC-S11 異常系: 元の配列を書き換えない", () => {
    const input = [...products];
    searchProducts(input, "");
    expect(input.map((x) => x.id)).toEqual(["1", "2", "3"]);
  });
});
