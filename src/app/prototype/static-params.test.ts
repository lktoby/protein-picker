import { describe, expect, it } from "vitest";
import { PRODUCTS } from "./_mock/products";
import { generateStaticParams as generateProductDetailParams } from "./products/[id]/page";
import { generateStaticParams as generatePurchaseParams } from "./purchase/[productId]/page";

describe("static export 用の動的ルート設定", () => {
  it("商品詳細ページが全商品IDの静的パラメータを返す", () => {
    expect(generateProductDetailParams()).toEqual(PRODUCTS.map((product) => ({ id: product.id })));
  });

  it("購入ページが全商品IDの静的パラメータを返す", () => {
    expect(generatePurchaseParams()).toEqual(
      PRODUCTS.map((product) => ({ productId: product.id }))
    );
  });
});
