import { describe, expect, it } from "vitest";
import { PRODUCTS, findProduct, minOnlinePrice, shippingBreakdownLabel } from "./products";

describe("prototype mock products", () => {
  it("findProduct が存在する商品を返す", () => {
    expect(findProduct(PRODUCTS[0].id)?.name).toBe(PRODUCTS[0].name);
  });

  it("shippingBreakdownLabel が送料内訳を返す", () => {
    const paidShipping = PRODUCTS[0].onlineShops.find((shop) => shop.shippingFee > 0);
    expect(paidShipping).toBeDefined();
    expect(shippingBreakdownLabel(paidShipping!)).toContain("送料");
  });

  it("minOnlinePrice が最安の総額を返す", () => {
    expect(minOnlinePrice(PRODUCTS[0])).toBe(
      Math.min(...PRODUCTS[0].onlineShops.map((shop) => shop.price))
    );
  });
});
