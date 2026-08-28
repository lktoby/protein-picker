// ============================================================
// 注文のリポジトリ層（F-06, F-07, F-08, F-10）
// 根拠: docs/03-design/db-design.md §5-7・§5-8、api-spec.md §5〜§7
// ============================================================
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import type { DeliveryStatus, PaymentMethod } from "@/server/domain/types";

export type OrderRow = typeof schema.orders.$inferSelect;

/** 注文とお問い合わせ先（F-08）をまとめた形 */
export type OrderWithContact = OrderRow & {
  contactEmail: string;
  contactPhone: string;
};

/** 注文番号を採番する。同時実行で衝突しないよう DB のシーケンスを使う（db-design.md §5-8） */
async function nextOrderNumber(): Promise<string> {
  const result = await db.execute<{ order_number: string }>(
    sql`SELECT 'ORD-' || LPAD(nextval('orders_number_seq')::text, 4, '0') AS order_number`,
  );
  return result.rows[0].order_number;
}

export async function findOrderByIdempotencyKey(key: string): Promise<OrderWithContact | null> {
  const rows = await db
    .select()
    .from(schema.orders)
    .innerJoin(schema.shops, eq(schema.orders.shopId, schema.shops.id))
    .where(eq(schema.orders.idempotencyKey, key))
    .limit(1);
  return rows.length > 0 ? withContact(rows[0]) : null;
}

export async function findOrderById(id: string): Promise<OrderWithContact | null> {
  const rows = await db
    .select()
    .from(schema.orders)
    .innerJoin(schema.shops, eq(schema.orders.shopId, schema.shops.id))
    .where(eq(schema.orders.id, id))
    .limit(1);
  return rows.length > 0 ? withContact(rows[0]) : null;
}

/** 注文履歴。新しい順（api-spec.md §6）。利用者で絞り込まない（要件 Q-09） */
export async function findAllOrders(): Promise<OrderWithContact[]> {
  const rows = await db
    .select()
    .from(schema.orders)
    .innerJoin(schema.shops, eq(schema.orders.shopId, schema.shops.id))
    .orderBy(desc(schema.orders.orderedAt));
  return rows.map(withContact);
}

export type InsertOrderInput = {
  idempotencyKey: string;
  productId: string;
  shopId: string;
  productNameSnapshot: string;
  productFlavorSnapshot: string;
  productImageUrlSnapshot: string;
  shopNameSnapshot: string;
  unitItemPrice: number;
  shippingFee: number;
  quantity: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
};

export async function insertOrder(input: InsertOrderInput): Promise<OrderWithContact> {
  const orderNumber = await nextOrderNumber();
  const [inserted] = await db
    .insert(schema.orders)
    .values({ ...input, orderNumber, deliveryStatus: "ordered" })
    .returning();

  const order = await findOrderById(inserted.id);
  if (!order) throw new Error("作成した注文を読み出せませんでした。");
  return order;
}

export async function updateDeliveryStatus(
  id: string,
  status: DeliveryStatus,
): Promise<OrderWithContact | null> {
  await db
    .update(schema.orders)
    .set({ deliveryStatus: status })
    .where(eq(schema.orders.id, id));
  return findOrderById(id);
}

function withContact(row: {
  orders: OrderRow;
  shops: typeof schema.shops.$inferSelect;
}): OrderWithContact {
  return {
    ...row.orders,
    contactEmail: row.shops.contactEmail,
    contactPhone: row.shops.contactPhone,
  };
}
