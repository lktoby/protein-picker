// F-09 サンプルデータの投入（npm run db:seed）
// 冪等: 同じ ID で ON CONFLICT DO UPDATE するため、何度実行しても重複しない（db-design.md §8）
// 注文（orders）はシードしない。空の注文履歴が初期状態として見えるようにする。
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/server/db/schema";
import {
  SEED_PRODUCTS,
  SEED_SHOPS,
  SEED_STORES,
  SHOP_ID_BY_INDEX,
  STORE_ID_BY_INDEX,
} from "../src/server/db/seed-data";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL が設定されていません。");

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  await db
    .insert(schema.shops)
    .values(SEED_SHOPS.map((s) => ({ ...s })))
    .onConflictDoUpdate({
      target: schema.shops.id,
      set: {
        name: schema.shops.name,
        shippingFee: schema.shops.shippingFee,
      },
    });

  await db
    .insert(schema.stores)
    .values(SEED_STORES.map((s) => ({ ...s })))
    .onConflictDoUpdate({ target: schema.stores.id, set: { name: schema.stores.name } });

  for (const p of SEED_PRODUCTS) {
    await db
      .insert(schema.products)
      .values({
        id: p.id,
        name: p.name,
        brand: p.brand,
        type: p.type,
        flavor: p.flavor,
        weightG: p.weightG,
        proteinContent: p.proteinContent,
        description: p.description,
        imageUrl: p.imageUrl,
        productGroupKey: p.productGroupKey,
      })
      .onConflictDoUpdate({
        target: schema.products.id,
        set: { name: schema.products.name, imageUrl: schema.products.imageUrl },
      });

    // タグと価格は入れ替えで冪等にする
    await db.delete(schema.productPurposes).where(eqProduct(schema.productPurposes.productId, p.id));
    await db.delete(schema.productTimings).where(eqProduct(schema.productTimings.productId, p.id));
    await db
      .delete(schema.productPreferences)
      .where(eqProduct(schema.productPreferences.productId, p.id));
    await db
      .delete(schema.productShopOffers)
      .where(eqProduct(schema.productShopOffers.productId, p.id));
    await db
      .delete(schema.productStoreOffers)
      .where(eqProduct(schema.productStoreOffers.productId, p.id));

    if (p.purposes.length > 0) {
      await db
        .insert(schema.productPurposes)
        .values(p.purposes.map((purpose) => ({ productId: p.id, purpose })));
    }
    if (p.timings.length > 0) {
      await db
        .insert(schema.productTimings)
        .values(p.timings.map((timing) => ({ productId: p.id, timing })));
    }
    if (p.preferences.length > 0) {
      await db
        .insert(schema.productPreferences)
        .values(p.preferences.map((preference) => ({ productId: p.id, preference })));
    }
    if (p.shopOffers.length > 0) {
      await db.insert(schema.productShopOffers).values(
        p.shopOffers.map(([shopIndex, itemPrice]) => ({
          productId: p.id,
          shopId: SHOP_ID_BY_INDEX[shopIndex],
          itemPrice,
        })),
      );
    }
    if (p.storeOffers.length > 0) {
      await db.insert(schema.productStoreOffers).values(
        p.storeOffers.map(([storeIndex, price]) => ({
          productId: p.id,
          storeId: STORE_ID_BY_INDEX[storeIndex],
          price,
        })),
      );
    }
  }

  console.log(
    `サンプルデータを投入しました: 商品 ${SEED_PRODUCTS.length} 件 / ショップ ${SEED_SHOPS.length} 件 / 実店舗 ${SEED_STORES.length} 件`,
  );
  await pool.end();
}

// eq をこのファイル内で使うための薄いラッパー（import の見通しを良くするため）
import { eq, type Column } from "drizzle-orm";
function eqProduct(column: Column, value: string) {
  return eq(column, value);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
