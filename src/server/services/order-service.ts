// ============================================================
// F-06 購入手続き / F-10 お届け状況の更新
// 根拠: docs/03-design/api-spec.md §5・§7・§9（RV-07 のガード）
//
// DB アクセスは deps で受け取る。テストを DB 起動に依存させないため（db-design.md §1 の方針）。
// ============================================================
import { orderTotal } from "@/server/domain/pricing";
import { canTransitionDeliveryStatus, validateOrderInput } from "@/server/domain/order-rules";
import { DELIVERY_STATUSES, type DeliveryStatus, type Shop } from "@/server/domain/types";
import type { FieldError } from "@/server/domain/order-rules";

/** 注文作成に必要な商品の最小情報（スナップショット用） */
export type ProductBasics = {
  id: string;
  name: string;
  flavor: string;
  imageUrl: string;
};

export type OrderServiceDeps = {
  findOrderByIdempotencyKey: (key: string) => Promise<unknown | null>;
  findProductBasics: (productId: string) => Promise<ProductBasics | null>;
  findShopOffer: (
    productId: string,
    shopId: string,
  ) => Promise<{ itemPrice: number; shop: Shop } | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insertOrder: (input: any) => Promise<any>;
  findOrderById: (id: string) => Promise<{ id: string; deliveryStatus: DeliveryStatus } | null>;
  updateDeliveryStatus: (id: string, status: DeliveryStatus) => Promise<unknown>;
};

export type CreateOrderResult =
  | { status: "created"; order: { deliveryStatus: DeliveryStatus } & Record<string, unknown> }
  | { status: "existing"; order: unknown }
  | { status: "invalid"; errors: FieldError[] }
  | { status: "not_found"; message: string }
  | { status: "unprocessable"; message: string };

/**
 * 注文を作成する。
 * RV-07 の 2 つのガードをここで担保する:
 *  - 指定ショップがその商品を扱っていなければ**フォールバックせず拒否**する
 *  - 同じ冪等キーの再送では**新規作成せず既存の注文を返す**
 */
export async function createOrder(
  rawInput: Record<string, unknown>,
  deps: OrderServiceDeps,
): Promise<CreateOrderResult> {
  const validation = validateOrderInput(rawInput);
  if (!validation.ok) {
    return { status: "invalid", errors: validation.errors };
  }
  const input = validation.value;

  // 二重送信防止（RV-07）: 同じキーの注文があればそれを返す
  const existing = await deps.findOrderByIdempotencyKey(input.idempotencyKey);
  if (existing) {
    return { status: "existing", order: existing };
  }

  const product = await deps.findProductBasics(input.productId);
  if (!product) {
    return { status: "not_found", message: "指定された商品が見つかりません。" };
  }

  // 不正な shop 指定のガード（RV-07）: 取り扱いが無ければ明確に拒否する
  const offer = await deps.findShopOffer(input.productId, input.shopId);
  if (!offer) {
    return {
      status: "unprocessable",
      message: "指定された販売ショップではこの商品を購入できません。",
    };
  }

  // 金額はサーバー側で決める（クライアントから価格を受け取らない）
  const unitItemPrice = offer.itemPrice;
  const shippingFee = offer.shop.shippingFee;
  const totalPrice = orderTotal({ unitItemPrice, quantity: input.quantity, shippingFee });

  const order = await deps.insertOrder({
    idempotencyKey: input.idempotencyKey,
    productId: product.id,
    shopId: offer.shop.id,
    productNameSnapshot: product.name,
    productFlavorSnapshot: product.flavor,
    productImageUrlSnapshot: product.imageUrl,
    shopNameSnapshot: offer.shop.name,
    unitItemPrice,
    shippingFee,
    quantity: input.quantity,
    totalPrice,
    paymentMethod: input.paymentMethod,
  });

  // F-10: 作成時のお届け状況は必ず「注文済み」
  return { status: "created", order: { deliveryStatus: "ordered", ...order } };
}

export type ChangeStatusResult =
  | { status: "updated"; order: unknown }
  | { status: "invalid"; message: string }
  | { status: "not_found"; message: string }
  | { status: "conflict"; message: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * お届け状況を更新する（管理用。利用者向けの画面は作らない。ui-spec.md §5）。
 * 許可する遷移は `ordered → shipping → delivered` の一方向のみ。
 */
export async function changeDeliveryStatus(
  orderId: string,
  next: DeliveryStatus,
  deps: OrderServiceDeps,
): Promise<ChangeStatusResult> {
  if (!UUID_PATTERN.test(orderId)) {
    return { status: "invalid", message: "注文の指定が正しくありません。" };
  }
  if (!DELIVERY_STATUSES.includes(next)) {
    return { status: "invalid", message: "お届け状況の指定が正しくありません。" };
  }

  const order = await deps.findOrderById(orderId);
  if (!order) {
    return { status: "not_found", message: "指定された注文が見つかりません。" };
  }

  if (!canTransitionDeliveryStatus(order.deliveryStatus, next)) {
    return {
      status: "conflict",
      message: "この注文のお届け状況をその状態へ変更できません。",
    };
  }

  const updated = await deps.updateDeliveryStatus(orderId, next);
  return { status: "updated", order: updated };
}
