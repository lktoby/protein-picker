// ============================================================
// 商品のリポジトリ層（DB アクセスのみ。業務ロジックは持たない）
// 根拠: docs/03-design/api-spec.md §1-1（層の分離）
// ============================================================
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import type { Product, Shop, Store } from "@/server/domain/types";

/** 全商品をドメインの型に組み立てて返す。件数が 10〜20 件（F-09）なので全件取得して結合する */
export async function findAllProducts(): Promise<Product[]> {
  const [rows, purposes, timings, preferences, shopOffers, storeOffers] = await Promise.all([
    db.select().from(schema.products),
    db.select().from(schema.productPurposes),
    db.select().from(schema.productTimings),
    db.select().from(schema.productPreferences),
    db
      .select()
      .from(schema.productShopOffers)
      .innerJoin(schema.shops, eq(schema.productShopOffers.shopId, schema.shops.id)),
    db
      .select()
      .from(schema.productStoreOffers)
      .innerJoin(schema.stores, eq(schema.productStoreOffers.storeId, schema.stores.id)),
  ]);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    brand: row.brand,
    type: row.type,
    flavor: row.flavor,
    weightG: row.weightG,
    proteinContent: row.proteinContent,
    description: row.description,
    imageUrl: row.imageUrl,
    purposes: purposes.filter((p) => p.productId === row.id).map((p) => p.purpose),
    timings: timings.filter((t) => t.productId === row.id).map((t) => t.timing),
    preferences: preferences.filter((p) => p.productId === row.id).map((p) => p.preference),
    shopOffers: shopOffers
      .filter((o) => o.product_shop_offers.productId === row.id)
      .map((o) => ({
        shop: toShop(o.shops),
        itemPrice: o.product_shop_offers.itemPrice,
      })),
    storeOffers: storeOffers
      .filter((o) => o.product_store_offers.productId === row.id)
      .map((o) => ({
        store: toStore(o.stores),
        price: o.product_store_offers.price,
      })),
  }));
}

export async function findProductById(id: string): Promise<Product | null> {
  const all = await findAllProducts();
  return all.find((p) => p.id === id) ?? null;
}

/** 指定ショップがその商品を取り扱っているかと、その商品代金を返す（RV-07 のガードに使う） */
export async function findShopOffer(
  productId: string,
  shopId: string,
): Promise<{ itemPrice: number; shop: Shop } | null> {
  const product = await findProductById(productId);
  if (!product) return null;
  const offer = product.shopOffers.find((o) => o.shop.id === shopId);
  return offer ? { itemPrice: offer.itemPrice, shop: offer.shop } : null;
}

function toShop(row: typeof schema.shops.$inferSelect): Shop {
  return {
    id: row.id,
    name: row.name,
    shippingFee: row.shippingFee,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
  };
}

function toStore(row: typeof schema.stores.$inferSelect): Store {
  return {
    id: row.id,
    name: row.name,
    access: row.access,
    phone: row.phone,
    businessHours: row.businessHours,
  };
}
