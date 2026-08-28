// ============================================================
// F-06 購入手続き / F-10 お届け状況の更新
// 根拠: docs/03-design/api-spec.md §5（バリデーション #5〜#7 = RV-07 のガード）・§7・§9
//
// DB に依存させないよう、リポジトリ相当の処理を差し替え可能な形で受け取る設計にしている。
// ============================================================
import { describe, expect, it, vi } from "vitest";
import { createOrder, changeDeliveryStatus, type OrderServiceDeps } from "./order-service";
import type { Shop } from "@/server/domain/types";

const UUID_PRODUCT = "0f1c8a12-3b4d-4e5f-8a9b-0c1d2e3f4a5b";
const UUID_SHOP = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const UUID_KEY = "5f0e8a12-9b8c-4d7e-8f6a-5b4c3d2e1f0a";
const UUID_ORDER = "9a7b6c5d-4e3f-4a2b-8c1d-0e9f8a7b6c5d";

const shop: Shop = {
  id: UUID_SHOP,
  name: "プロテインマート",
  shippingFee: 500,
  contactEmail: "support@example.com",
  contactPhone: "0120-111-222",
};

const productSummary = {
  id: UUID_PRODUCT,
  name: "テストプロテイン",
  flavor: "チョコレート風味",
  imageUrl: "/images/products/whey.svg",
};

const validInput = {
  productId: UUID_PRODUCT,
  shopId: UUID_SHOP,
  quantity: 2,
  paymentMethod: "credit_card",
  idempotencyKey: UUID_KEY,
};

function makeDeps(overrides: Partial<OrderServiceDeps> = {}): OrderServiceDeps {
  return {
    findOrderByIdempotencyKey: vi.fn().mockResolvedValue(null),
    findProductBasics: vi.fn().mockResolvedValue(productSummary),
    findShopOffer: vi.fn().mockResolvedValue({ itemPrice: 3480, shop }),
    insertOrder: vi.fn().mockImplementation(async (v) => ({ id: UUID_ORDER, ...v })),
    findOrderById: vi.fn().mockResolvedValue(null),
    updateDeliveryStatus: vi.fn(),
    ...overrides,
  };
}

describe("createOrder — 注文の作成（F-06）", () => {
  it("TC-O18 正常系: 妥当な入力なら注文を作成する", async () => {
    const deps = makeDeps();
    const result = await createOrder(validInput, deps);
    expect(result.status).toBe("created");
  });

  it("TC-O19 正常系: 金額はサーバー側で計算する（送料は注文単位で 1 回）", async () => {
    const deps = makeDeps();
    await createOrder(validInput, deps);
    expect(deps.insertOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        unitItemPrice: 3480,
        shippingFee: 500,
        quantity: 2,
        totalPrice: 7460, // 3480 * 2 + 500
      }),
    );
  });

  it("TC-O20 正常系: 購入時点の商品名・ショップ名をスナップショットする", async () => {
    const deps = makeDeps();
    await createOrder(validInput, deps);
    expect(deps.insertOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        productNameSnapshot: "テストプロテイン",
        productFlavorSnapshot: "チョコレート風味",
        shopNameSnapshot: "プロテインマート",
      }),
    );
  });

  it("TC-O21 異常系: バリデーション違反は作成せずエラーを返す", async () => {
    const deps = makeDeps();
    const result = await createOrder({ ...validInput, quantity: 99 }, deps);
    expect(result.status).toBe("invalid");
    expect(deps.insertOrder).not.toHaveBeenCalled();
  });

  it("TC-O22 異常系: 商品が存在しなければ not_found を返す", async () => {
    const deps = makeDeps({ findProductBasics: vi.fn().mockResolvedValue(null) });
    const result = await createOrder(validInput, deps);
    expect(result.status).toBe("not_found");
    expect(deps.insertOrder).not.toHaveBeenCalled();
  });

  it("TC-O23 異常系: 指定ショップがその商品を扱っていなければ拒否する（RV-07・フォールバックしない）", async () => {
    const deps = makeDeps({ findShopOffer: vi.fn().mockResolvedValue(null) });
    const result = await createOrder(validInput, deps);
    expect(result.status).toBe("unprocessable");
    // 先頭ショップなどに勝手に読み替えて作成してはいけない
    expect(deps.insertOrder).not.toHaveBeenCalled();
  });

  it("TC-O24 正常系: 同じ冪等キーの再送は新規作成せず既存の注文を返す（RV-07 二重送信防止）", async () => {
    const existing = { id: UUID_ORDER, orderNumber: "ORD-0001" };
    const deps = makeDeps({
      findOrderByIdempotencyKey: vi.fn().mockResolvedValue(existing),
    });
    const result = await createOrder(validInput, deps);
    expect(result.status).toBe("existing");
    expect(deps.insertOrder).not.toHaveBeenCalled();
    if (result.status === "existing") expect(result.order).toEqual(existing);
  });

  it("TC-O25 正常系: 作成時のお届け状況は必ず「注文済み」になる（F-10）", async () => {
    const deps = makeDeps();
    const result = await createOrder(validInput, deps);
    expect(result.status).toBe("created");
    if (result.status === "created") expect(result.order.deliveryStatus).toBe("ordered");
  });

  it("TC-O26 異常系: カード情報を渡しても保存対象に含めない（個人情報を扱わない）", async () => {
    const deps = makeDeps();
    await createOrder({ ...validInput, cardNumber: "4111111111111111" }, deps);
    const passed = (deps.insertOrder as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(passed).not.toHaveProperty("cardNumber");
  });
});

describe("changeDeliveryStatus — お届け状況の更新（F-10 / api-spec.md §7）", () => {
  it("TC-O27 正常系: 注文済み → お届け中 は更新できる", async () => {
    const deps = makeDeps({
      findOrderById: vi.fn().mockResolvedValue({ id: UUID_ORDER, deliveryStatus: "ordered" }),
      updateDeliveryStatus: vi
        .fn()
        .mockResolvedValue({ id: UUID_ORDER, deliveryStatus: "shipping" }),
    });
    const result = await changeDeliveryStatus(UUID_ORDER, "shipping", deps);
    expect(result.status).toBe("updated");
    expect(deps.updateDeliveryStatus).toHaveBeenCalledWith(UUID_ORDER, "shipping");
  });

  it("TC-O28 異常系: 注文が存在しなければ not_found", async () => {
    const deps = makeDeps({ findOrderById: vi.fn().mockResolvedValue(null) });
    const result = await changeDeliveryStatus(UUID_ORDER, "shipping", deps);
    expect(result.status).toBe("not_found");
  });

  it("TC-O29 異常系: 飛び越し（注文済み → お届け済み）は conflict にして更新しない", async () => {
    const deps = makeDeps({
      findOrderById: vi.fn().mockResolvedValue({ id: UUID_ORDER, deliveryStatus: "ordered" }),
    });
    const result = await changeDeliveryStatus(UUID_ORDER, "delivered", deps);
    expect(result.status).toBe("conflict");
    expect(deps.updateDeliveryStatus).not.toHaveBeenCalled();
  });

  it("TC-O30 異常系: 逆行（お届け済み → お届け中）は conflict にして更新しない", async () => {
    const deps = makeDeps({
      findOrderById: vi.fn().mockResolvedValue({ id: UUID_ORDER, deliveryStatus: "delivered" }),
    });
    const result = await changeDeliveryStatus(UUID_ORDER, "shipping", deps);
    expect(result.status).toBe("conflict");
    expect(deps.updateDeliveryStatus).not.toHaveBeenCalled();
  });

  it("TC-O31 異常系: 注文 ID が UUID 形式でなければ invalid", async () => {
    const deps = makeDeps();
    const result = await changeDeliveryStatus("not-a-uuid", "shipping", deps);
    expect(result.status).toBe("invalid");
  });

  it("TC-O32 異常系: 未知の状態への更新は invalid", async () => {
    const deps = makeDeps({
      findOrderById: vi.fn().mockResolvedValue({ id: UUID_ORDER, deliveryStatus: "ordered" }),
    });
    // 型を外れた値が API 経由で来るケース
    const result = await changeDeliveryStatus(UUID_ORDER, "unknown" as never, deps);
    expect(result.status).toBe("invalid");
  });
});
