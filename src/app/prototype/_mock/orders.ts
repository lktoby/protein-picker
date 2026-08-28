// ============================================================
// プロトタイプ用の注文ストア（捨てる前提の使い捨てコード）
// モジュール変数に保持するだけ。ページをリロードすると消える。
// ※ 本実装ではデータベースに保存する（/design で確定）。
// ============================================================

/** RV-17: お届け状況 */
export type DeliveryStatus = "ordered" | "shipping" | "delivered";

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  ordered: "注文済み",
  shipping: "お届け中",
  delivered: "お届け済み",
};

/** 状態が進む順序（本実装では配送業者の情報などで更新される想定） */
export const DELIVERY_STATUS_ORDER: DeliveryStatus[] = ["ordered", "shipping", "delivered"];

export type Order = {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  flavor: string;
  emoji: string;
  colors: [string, string];
  shopName: string;
  unitPrice: number;
  quantity: number;
  paymentMethod: string;
  orderedAt: string; // 表示用の日時文字列
  contactEmail: string;
  contactPhone: string;
  status: DeliveryStatus; // RV-17
};

let orders: Order[] = [];
let seq = 1;

export function addOrder(order: Omit<Order, "id" | "orderedAt" | "status">): Order {
  const created: Order = {
    ...order,
    id: `ORD-${String(seq++).padStart(4, "0")}`,
    orderedAt: new Date().toLocaleString("ja-JP"),
    status: "ordered", // 注文直後は「注文済み」
  };
  orders = [created, ...orders];
  return created;
}

export function getOrders(): Order[] {
  return orders;
}

/**
 * デモ専用: お届け状況を次の段階へ進める。
 * 本実装では配送業者の情報や管理側の操作で更新される想定で、
 * ユーザーがこのボタンで進める画面は作らない（ui-spec.md §8 参照）。
 */
export function advanceStatusForDemo(id: string): void {
  orders = orders.map((o) => {
    if (o.id !== id) return o;
    const next = DELIVERY_STATUS_ORDER[DELIVERY_STATUS_ORDER.indexOf(o.status) + 1];
    return next ? { ...o, status: next } : o;
  });
}
