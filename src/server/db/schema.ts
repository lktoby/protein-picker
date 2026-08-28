// ============================================================
// DB スキーマ（Drizzle ORM）
// 根拠: docs/03-design/db-design.md §4（ENUM）・§5（テーブル定義）
// ============================================================
import {
  check,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------- ENUM（db-design.md §4） ----------
export const purposeEnum = pgEnum("purpose", ["muscle", "diet", "health"]);
export const timingEnum = pgEnum("timing", ["post_workout", "morning", "before_sleep", "snack"]);
export const preferenceEnum = pgEnum("preference", [
  "lactose_free",
  "vegan",
  "low_sugar",
  "domestic",
  "low_price",
]);
export const proteinTypeEnum = pgEnum("protein_type", ["whey", "wpi", "casein", "soy", "mix"]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "credit_card",
  "convenience_store",
  "bank_transfer",
]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["ordered", "shipping", "delivered"]);

// ---------- 商品マスタ（F-09, F-04, F-03 / db-design.md §5-1） ----------
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    brand: text("brand").notNull(),
    type: proteinTypeEnum("type").notNull(),
    flavor: text("flavor").notNull(),
    weightG: integer("weight_g").notNull(),
    proteinContent: integer("protein_content").notNull(),
    description: text("description").notNull(),
    imageUrl: text("image_url").notNull(),
    /** 味違いを将来まとめるための予備。今回は表示・検索に使わない（db-design.md §2-1） */
    productGroupKey: text("product_group_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("products_weight_g_positive", sql`${t.weightG} > 0`),
    check(
      "products_protein_content_range",
      sql`${t.proteinContent} >= 0 AND ${t.proteinContent} <= 100`,
    ),
    index("idx_products_name").on(t.name, t.flavor),
  ],
);

// ---------- 商品の条件タグ（F-01, F-02 / db-design.md §5-2） ----------
export const productPurposes = pgTable(
  "product_purposes",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    purpose: purposeEnum("purpose").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.purpose] }),
    index("idx_product_purposes_value").on(t.purpose),
  ],
);

export const productTimings = pgTable(
  "product_timings",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    timing: timingEnum("timing").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.timing] }),
    index("idx_product_timings_value").on(t.timing),
  ],
);

export const productPreferences = pgTable(
  "product_preferences",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    preference: preferenceEnum("preference").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.preference] }),
    index("idx_product_preferences_value").on(t.preference),
  ],
);

// ---------- ネット通販ショップ（F-04, F-06, F-08 / db-design.md §5-3） ----------
export const shops = pgTable(
  "shops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** 送料（円）。ショップごとに決まる値（ui-spec.md §6）。0 は送料無料 */
    shippingFee: integer("shipping_fee").notNull(),
    contactEmail: text("contact_email").notNull(),
    contactPhone: text("contact_phone").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("shops_shipping_fee_non_negative", sql`${t.shippingFee} >= 0`)],
);

// ---------- 実店舗（F-05 / db-design.md §5-4） ----------
export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  access: text("access").notNull(),
  phone: text("phone").notNull(),
  businessHours: text("business_hours").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- 価格（db-design.md §5-5・§5-6） ----------
export const productShopOffers = pgTable(
  "product_shop_offers",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    /** 商品代金（円・送料を含まない）。総額は itemPrice + shops.shippingFee */
    itemPrice: integer("item_price").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.shopId] }),
    check("product_shop_offers_item_price_positive", sql`${t.itemPrice} > 0`),
    index("idx_offers_shop_product").on(t.shopId, t.productId),
  ],
);

export const productStoreOffers = pgTable(
  "product_store_offers",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    /** 店頭価格（円）。送料が無いためこれが総額 */
    price: integer("price").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.storeId] }),
    check("product_store_offers_price_positive", sql`${t.price} > 0`),
  ],
);

// ---------- 注文（F-06, F-07, F-08, F-10 / db-design.md §5-7） ----------
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull(),
    /** 二重送信防止キー（RV-07）。同じキーの再送は新規作成しない */
    idempotencyKey: text("idempotency_key").notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "restrict" }),
    // 購入時点のスナップショット（db-design.md §2 の方針4）
    productNameSnapshot: text("product_name_snapshot").notNull(),
    productFlavorSnapshot: text("product_flavor_snapshot").notNull(),
    productImageUrlSnapshot: text("product_image_url_snapshot").notNull(),
    shopNameSnapshot: text("shop_name_snapshot").notNull(),
    unitItemPrice: integer("unit_item_price").notNull(),
    /** 送料。注文単位で 1 回分（design questions.md Q-01 で確定） */
    shippingFee: integer("shipping_fee").notNull(),
    quantity: integer("quantity").notNull(),
    totalPrice: integer("total_price").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    /** お届け状況（F-10）。作成時は必ず ordered */
    deliveryStatus: deliveryStatusEnum("delivery_status").notNull().default("ordered"),
    orderedAt: timestamp("ordered_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_orders_order_number").on(t.orderNumber),
    uniqueIndex("uq_orders_idempotency_key").on(t.idempotencyKey),
    index("idx_orders_ordered_at").on(t.orderedAt.desc()),
    // ui-spec.md §4 の「数量 1〜5」を DB 制約でも守る
    check("orders_quantity_range", sql`${t.quantity} >= 1 AND ${t.quantity} <= 5`),
    check("orders_total_price_positive", sql`${t.totalPrice} > 0`),
    check("orders_shipping_fee_non_negative", sql`${t.shippingFee} >= 0`),
  ],
);
