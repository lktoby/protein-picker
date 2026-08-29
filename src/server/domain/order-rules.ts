// ============================================================
// F-06 購入手続き / F-10 お届け状況
// 根拠: docs/03-design/api-spec.md §5（バリデーション・RV-07 のガード）・§7（状態遷移）
// ============================================================
import {
  DELIVERY_STATUSES,
  PAYMENT_METHODS,
  type DeliveryStatus,
  type PaymentMethod,
} from "./types";

/** ui-spec.md §4: 数量は 1〜5 */
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 5;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type FieldError = { field: string; message: string };

export type ValidatedOrderInput = {
  productId: string;
  shopId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
};

export type ValidationResult =
  | { ok: true; value: ValidatedOrderInput }
  | { ok: false; errors: FieldError[] };

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * 注文入力を検証する。
 * **カード番号・名義・有効期限は受け取らない**（要件スコープ外 #2）。
 * 余分なキーが来ても検証済みの値には含めないことで、個人情報が流れ込む経路を作らない。
 */
export function validateOrderInput(input: Record<string, unknown>): ValidationResult {
  const errors: FieldError[] = [];

  if (!isUuid(input.productId)) {
    errors.push({ field: "productId", message: "商品の指定が正しくありません。" });
  }
  if (!isUuid(input.shopId)) {
    errors.push({ field: "shopId", message: "販売ショップの指定が正しくありません。" });
  }
  if (!isUuid(input.idempotencyKey)) {
    errors.push({
      field: "idempotencyKey",
      message: "注文の識別子が正しくありません。画面を再読み込みしてやり直してください。",
    });
  }

  const quantity = input.quantity;
  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity < MIN_QUANTITY ||
    quantity > MAX_QUANTITY
  ) {
    errors.push({
      field: "quantity",
      message: `数量は ${MIN_QUANTITY}〜${MAX_QUANTITY} の範囲で指定してください。`,
    });
  }

  const paymentMethod = input.paymentMethod;
  if (!PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) {
    errors.push({ field: "paymentMethod", message: "お支払い方法の指定が正しくありません。" });
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      productId: input.productId as string,
      shopId: input.shopId as string,
      quantity: quantity as number,
      paymentMethod: paymentMethod as PaymentMethod,
      idempotencyKey: input.idempotencyKey as string,
    },
  };
}

/**
 * お届け状況の遷移が許されるか（api-spec.md §7）。
 * `ordered → shipping → delivered` の一方向のみ。逆行・飛び越し・同じ状態への更新は拒否する。
 */
export function canTransitionDeliveryStatus(from: DeliveryStatus, to: DeliveryStatus): boolean {
  const fromIndex = DELIVERY_STATUSES.indexOf(from);
  const toIndex = DELIVERY_STATUSES.indexOf(to);
  if (fromIndex < 0 || toIndex < 0) return false;
  return toIndex - fromIndex === 1;
}
