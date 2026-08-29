// ============================================================
// 価格の導出ロジック（純関数）
// 根拠: docs/02-prototype/ui-spec.md §6（価格表示ルール）、docs/03-design/db-design.md §7
//
// ui-spec.md §6 の共通ルール「送料込みで終わらせず、必ず送料の金額を明記する」を
// この 1 ファイルに閉じ込め、画面ごとの実装漏れ（RV-16 → RV-18 で 2 度指摘された）を防ぐ。
// ============================================================
import type { Product, ShopOffer } from "./types";

/** ネット通販の総額（円）= 商品代金 + そのショップの送料 */
export function shopTotalPrice(offer: ShopOffer): number {
  return offer.itemPrice + offer.shop.shippingFee;
}

/** 金額の表示整形。例: 3480 → "3,480円" */
export function formatYen(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}

/**
 * 最安値を出している販売チャネル。
 * ネット通販と実店舗が同額のときはネット通販を優先する（アプリ内で購入できる方を案内するため）。
 */
export type CheapestSource =
  | { kind: "online"; name: string; price: number; shippingFee: number }
  | { kind: "store"; name: string; price: number };

export function cheapestSource(product: Product): CheapestSource {
  const online = product.shopOffers.map((offer) => ({
    kind: "online" as const,
    name: offer.shop.name,
    price: shopTotalPrice(offer),
    shippingFee: offer.shop.shippingFee,
  }));
  const offline = product.storeOffers.map((offer) => ({
    kind: "store" as const,
    name: offer.store.name,
    price: offer.price,
  }));

  const candidates: CheapestSource[] = [...online, ...offline];
  if (candidates.length === 0) {
    throw new Error(`販売チャネルが登録されていない商品です: ${product.id}`);
  }
  // 同額なら先に並べたネット通販が残る（reduce は厳密に小さいときだけ入れ替える）
  return candidates.reduce((min, candidate) => (candidate.price < min.price ? candidate : min));
}

/** 最安値（円）。ネット通販・実店舗を含む全チャネルの最低価格（送料込み） */
export function lowestPrice(product: Product): number {
  return cheapestSource(product).price;
}

/** 最安値を出している販売元の名前。おすすめカードの「最安値: ショップ名」に使う（RV-18①） */
export function cheapestSourceName(product: Product): string {
  return cheapestSource(product).name;
}

/** 1g あたり価格。容量が違う商品を公平に比べるための中核指標（ui-spec.md §6） */
export function pricePerGram(product: Product): number {
  if (product.weightG <= 0) {
    throw new Error(`内容量が不正な商品です: ${product.id}`);
  }
  return lowestPrice(product) / product.weightG;
}

/**
 * 価格に添える送料の注記（ui-spec.md §6 / RV-18①）。
 * 「最安値・送料込み」で終わらせず、送料がいくらかを必ず示す。
 */
export type ShippingNote = {
  kind: "included" | "free" | "store";
  fee: number;
  label: string;
};

export function shippingNote(product: Product): ShippingNote {
  const source = cheapestSource(product);
  if (source.kind === "store") {
    return { kind: "store", fee: 0, label: "店頭価格・送料なし" };
  }
  if (source.shippingFee === 0) {
    return { kind: "free", fee: 0, label: "送料無料" };
  }
  return {
    kind: "included",
    fee: source.shippingFee,
    label: `内 送料 ${formatYen(source.shippingFee)}`,
  };
}

/**
 * 商品詳細のショップ行に出す内訳（ui-spec.md §6 / RV-16）。
 * 記号は半角に統一する（RV-18②）。
 */
export function breakdownLabel(offer: ShopOffer): string {
  if (offer.shop.shippingFee === 0) {
    return "送料無料";
  }
  return `商品 ${formatYen(offer.itemPrice)} + 送料 ${formatYen(offer.shop.shippingFee)}`;
}

/**
 * 注文の合計金額。
 * **送料は注文単位で 1 回**（数量では乗じない）。docs/03-design/questions.md Q-01 で確定。
 */
export function orderTotal(input: {
  unitItemPrice: number;
  quantity: number;
  shippingFee: number;
}): number {
  return input.unitItemPrice * input.quantity + input.shippingFee;
}

/** ネット通販のショップを総額の安い順に並べる。同額はショップ名の昇順で安定させる（RV-11） */
export function sortShopOffersByTotal(offers: ShopOffer[]): ShopOffer[] {
  return [...offers].sort((a, b) => {
    const diff = shopTotalPrice(a) - shopTotalPrice(b);
    return diff !== 0 ? diff : a.shop.name.localeCompare(b.shop.name, "ja");
  });
}
