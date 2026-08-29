// ============================================================
// F-03 商品検索 / F-04 商品情報の一気見 / F-05 実店舗情報
// 根拠: docs/03-design/api-spec.md §2・§3
// ============================================================
import {
  breakdownLabel,
  cheapestSourceName,
  lowestPrice,
  pricePerGram,
  shippingNote,
  shopTotalPrice,
  sortShopOffersByTotal,
  type ShippingNote,
} from "@/server/domain/pricing";
import { searchProducts } from "@/server/domain/search";
import { PREFERENCE_LABELS, PROTEIN_TYPE_LABELS, type Product } from "@/server/domain/types";
import { findAllProducts, findProductById } from "@/server/repositories/products";

/** 一覧・おすすめカードで使う商品サマリー（api-spec.md §2） */
export type ProductSummary = {
  id: string;
  name: string;
  brand: string;
  type: Product["type"];
  typeLabel: string;
  flavor: string;
  weightG: number;
  proteinContent: number;
  imageUrl: string;
  lowestPrice: number;
  pricePerGram: number;
  shippingNote: ShippingNote;
  cheapestSourceName: string;
};

export function toProductSummary(product: Product): ProductSummary {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    type: product.type,
    typeLabel: PROTEIN_TYPE_LABELS[product.type],
    flavor: product.flavor,
    weightG: product.weightG,
    proteinContent: product.proteinContent,
    imageUrl: product.imageUrl,
    lowestPrice: lowestPrice(product),
    pricePerGram: pricePerGram(product),
    shippingNote: shippingNote(product),
    cheapestSourceName: cheapestSourceName(product),
  };
}

export async function listProducts(query: string): Promise<{
  items: ProductSummary[];
  total: number;
  query: string;
}> {
  const all = await findAllProducts();
  const matched = searchProducts(all, query);
  return {
    items: matched.map(toProductSummary),
    total: matched.length,
    query,
  };
}

/** 商品詳細（api-spec.md §3） */
export type ProductDetail = ProductSummary & {
  description: string;
  preferenceLabels: string[];
  onlineShops: Array<{
    shopId: string;
    name: string;
    itemPrice: number;
    shippingFee: number;
    totalPrice: number;
    pricePerGram: number;
    isCheapest: boolean;
    breakdownLabel: string;
  }>;
  stores: Array<{
    storeId: string;
    name: string;
    price: number;
    access: string;
    phone: string;
    businessHours: string;
  }>;
};

export function toProductDetail(product: Product): ProductDetail {
  // RV-11: 総額の安い順に並べ、先頭（最安）に印を付ける
  const sorted = sortShopOffersByTotal(product.shopOffers);
  return {
    ...toProductSummary(product),
    description: product.description,
    preferenceLabels: product.preferences.map((p) => PREFERENCE_LABELS[p]),
    onlineShops: sorted.map((offer, index) => ({
      shopId: offer.shop.id,
      name: offer.shop.name,
      itemPrice: offer.itemPrice,
      shippingFee: offer.shop.shippingFee,
      totalPrice: shopTotalPrice(offer),
      pricePerGram: shopTotalPrice(offer) / product.weightG,
      isCheapest: index === 0,
      breakdownLabel: breakdownLabel(offer),
    })),
    stores: [...product.storeOffers]
      .sort((a, b) => a.price - b.price)
      .map((offer) => ({
        storeId: offer.store.id,
        name: offer.store.name,
        price: offer.price,
        access: offer.store.access,
        phone: offer.store.phone,
        businessHours: offer.store.businessHours,
      })),
  };
}

export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  const product = await findProductById(id);
  return product ? toProductDetail(product) : null;
}
