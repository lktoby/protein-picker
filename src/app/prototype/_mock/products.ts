import { PREFERENCE_LABELS, type Preference } from "@/server/domain/types";

export type OnlineShop = {
  id: string;
  name: string;
  price: number;
  shippingFee: number;
  email: string;
  phone: string;
};

export type Store = {
  id: string;
  name: string;
  price: number;
  access: string;
  phone: string;
  hours: string;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  type: string;
  flavor: string;
  weightG: number;
  proteinContent: number;
  description: string;
  emoji: string;
  colors: [string, string];
  preferences: Preference[];
  onlineShops: OnlineShop[];
  stores: Store[];
};

export const PRODUCTS: Product[] = [
  {
    id: "p-01",
    name: "マッスルグロウ ホエイ100",
    brand: "筋トレ堂",
    type: "whey",
    flavor: "チョコレート風味",
    weightG: 1000,
    proteinContent: 75,
    description: "定番のホエイプロテイン。トレーニング後の一杯に。",
    emoji: "💪",
    colors: ["#34d399", "#10b981"],
    preferences: ["low_price"],
    onlineShops: [
      {
        id: "shop-a",
        name: "プロテインマート",
        price: 3980,
        shippingFee: 500,
        email: "support@protein-mart.example.com",
        phone: "0120-111-222",
      },
      {
        id: "shop-b",
        name: "フィットEC",
        price: 4180,
        shippingFee: 0,
        email: "cs@fit-ec.example.com",
        phone: "03-1234-5678",
      },
    ],
    stores: [
      {
        id: "store-a",
        name: "フィットネスショップ 池袋店",
        price: 4280,
        access: "JR池袋駅 東口から徒歩5分",
        phone: "03-1111-2222",
        hours: "10:00-21:00",
      },
    ],
  },
  {
    id: "p-02",
    name: "ソイスリム",
    brand: "グリーンフィット",
    type: "soy",
    flavor: "ココア風味",
    weightG: 900,
    proteinContent: 72,
    description: "大豆由来でゆっくり吸収。腹持ちがよくダイエット中にも。",
    emoji: "🌱",
    colors: ["#bbf7d0", "#4ade80"],
    preferences: ["vegan", "lactose_free", "low_sugar"],
    onlineShops: [
      {
        id: "shop-c",
        name: "グリーンフィット公式",
        price: 3780,
        shippingFee: 600,
        email: "help@greenfit.example.com",
        phone: "0120-555-666",
      },
    ],
    stores: [
      {
        id: "store-b",
        name: "ナチュラルマーケット 渋谷店",
        price: 3980,
        access: "渋谷駅 ハチ公口から徒歩7分",
        phone: "03-5555-6666",
        hours: "10:00-22:00",
      },
    ],
  },
];

export { PREFERENCE_LABELS };

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

export function formatYen(value: number): string {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(value);
}

export function minOnlinePrice(product: Product): number {
  return Math.min(...product.onlineShops.map((shop) => shop.price));
}

export function pricePerGram(product: Product): number {
  return minOnlinePrice(product) / product.weightG;
}

export function shippingFeeOf(shopId: string): number {
  for (const product of PRODUCTS) {
    const shop = product.onlineShops.find((onlineShop) => onlineShop.id === shopId);
    if (shop) return shop.shippingFee;
  }
  return 0;
}

export function itemPriceOf(shop: OnlineShop): number {
  return shop.price - shop.shippingFee;
}

export function shippingBreakdownLabel(shop: OnlineShop): string {
  return shop.shippingFee === 0
    ? "商品代金のみ（送料無料）"
    : `商品代金${formatYen(itemPriceOf(shop))} + 送料${formatYen(shop.shippingFee)}`;
}

export function shippingNoteOf(product: Product): string {
  const cheapest = [...product.onlineShops].sort((a, b) => a.price - b.price)[0];
  if (!cheapest || cheapest.shippingFee === 0) return "送料無料";
  return `送料${formatYen(cheapest.shippingFee)}`;
}
