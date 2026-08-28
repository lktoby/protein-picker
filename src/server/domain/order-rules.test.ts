// ============================================================
// F-06 購入手続き / F-10 お届け状況
// 根拠: docs/03-design/api-spec.md §5（バリデーション表・RV-07 のガード）・§7（状態遷移）
//       docs/02-prototype/ui-spec.md §4（数量 1〜5）・§5（お届け状況は 3 段階）
// ============================================================
import { describe, expect, it } from "vitest";
import { canTransitionDeliveryStatus, validateOrderInput } from "./order-rules";

const UUID_A = "0f1c8a12-3b4d-4e5f-8a9b-0c1d2e3f4a5b";
const UUID_B = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const UUID_KEY = "5f0e8a12-9b8c-4d7e-8f6a-5b4c3d2e1f0a";

const validInput = {
  productId: UUID_A,
  shopId: UUID_B,
  quantity: 2,
  paymentMethod: "credit_card",
  idempotencyKey: UUID_KEY,
};

describe("validateOrderInput — 注文入力の検証（api-spec.md §5）", () => {
  it("TC-O01 正常系: 妥当な入力を受理する", () => {
    const result = validateOrderInput(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.quantity).toBe(2);
      expect(result.value.paymentMethod).toBe("credit_card");
    }
  });

  it("TC-O03 境界値: 数量 1（下限）は妥当", () => {
    expect(validateOrderInput({ ...validInput, quantity: 1 }).ok).toBe(true);
  });

  it("TC-O04 境界値: 数量 5（上限）は妥当", () => {
    expect(validateOrderInput({ ...validInput, quantity: 5 }).ok).toBe(true);
  });

  it("TC-O02 異常系: 数量 0 は不正", () => {
    const result = validateOrderInput({ ...validInput, quantity: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((e) => e.field)).toContain("quantity");
  });

  it("TC-O05 異常系: 数量 6（上限超え）は不正", () => {
    expect(validateOrderInput({ ...validInput, quantity: 6 }).ok).toBe(false);
  });

  it("TC-O06 異常系: 数量が整数でない場合は不正", () => {
    expect(validateOrderInput({ ...validInput, quantity: 1.5 }).ok).toBe(false);
  });

  it("TC-O06b 異常系: 数量が数値でない場合は不正", () => {
    expect(validateOrderInput({ ...validInput, quantity: "2" }).ok).toBe(false);
  });

  it("TC-O07 異常系: 未知の支払い方法は不正", () => {
    const result = validateOrderInput({ ...validInput, paymentMethod: "paypay" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((e) => e.field)).toContain("paymentMethod");
  });

  it("TC-O08 異常系: productId が UUID 形式でなければ不正", () => {
    const result = validateOrderInput({ ...validInput, productId: "p01" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((e) => e.field)).toContain("productId");
  });

  it("TC-O08b 異常系: shopId が UUID 形式でなければ不正", () => {
    expect(validateOrderInput({ ...validInput, shopId: "shop-1" }).ok).toBe(false);
  });

  it("TC-O09 異常系: idempotencyKey が UUID 形式でなければ不正（RV-07 の二重送信防止に必要）", () => {
    const result = validateOrderInput({ ...validInput, idempotencyKey: "abc" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((e) => e.field)).toContain("idempotencyKey");
  });

  it("TC-O09b 異常系: idempotencyKey が欠けていれば不正", () => {
    const withoutKey: Record<string, unknown> = { ...validInput };
    delete withoutKey.idempotencyKey;
    expect(validateOrderInput(withoutKey).ok).toBe(false);
  });

  it("TC-O10 異常系: 複数の不正はまとめて返す（項目ごとの理由が分かる）", () => {
    const result = validateOrderInput({
      productId: "bad",
      shopId: "bad",
      quantity: 99,
      paymentMethod: "bad",
      idempotencyKey: "bad",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(5);
      // 利用者に見せられる日本語のメッセージであること（api-spec.md §1-4）
      for (const e of result.errors) expect(e.message.length).toBeGreaterThan(0);
    }
  });

  it("TC-O10b 異常系: カード情報を渡しても受け付けない（個人情報を扱わない / api-spec.md §5）", () => {
    const result = validateOrderInput({ ...validInput, cardNumber: "4111111111111111" });
    expect(result.ok).toBe(true);
    // 検証済みの値にカード情報が残っていないこと
    if (result.ok) expect(result.value).not.toHaveProperty("cardNumber");
  });
});

describe("canTransitionDeliveryStatus — お届け状況の状態遷移（api-spec.md §7 / F-10）", () => {
  it("TC-O11 正常系: 注文済み → お届け中 は許可", () => {
    expect(canTransitionDeliveryStatus("ordered", "shipping")).toBe(true);
  });

  it("TC-O12 正常系: お届け中 → お届け済み は許可", () => {
    expect(canTransitionDeliveryStatus("shipping", "delivered")).toBe(true);
  });

  it("TC-O13 異常系: 注文済み → お届け済み（飛び越し）は不可", () => {
    expect(canTransitionDeliveryStatus("ordered", "delivered")).toBe(false);
  });

  it("TC-O14 異常系: お届け済み → お届け中（逆行）は不可", () => {
    expect(canTransitionDeliveryStatus("delivered", "shipping")).toBe(false);
  });

  it("TC-O15 異常系: お届け中 → 注文済み（逆行）は不可", () => {
    expect(canTransitionDeliveryStatus("shipping", "ordered")).toBe(false);
  });

  it("TC-O16 異常系: 同じ状態への更新は不可（誤操作を検知する）", () => {
    expect(canTransitionDeliveryStatus("ordered", "ordered")).toBe(false);
    expect(canTransitionDeliveryStatus("shipping", "shipping")).toBe(false);
    expect(canTransitionDeliveryStatus("delivered", "delivered")).toBe(false);
  });

  it("TC-O17 異常系: お届け済みからは先に進めない（終端状態）", () => {
    expect(canTransitionDeliveryStatus("delivered", "ordered")).toBe(false);
  });
});
