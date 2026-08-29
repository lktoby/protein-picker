// ============================================================
// ドメインの型と表示ラベル
// 根拠: docs/03-design/db-design.md §4（ENUM 定義）、docs/02-prototype/ui-spec.md
// 表示ラベルは DB に持たず、ここを唯一の出所とする（db-design.md §4）。
// ============================================================

export const PURPOSES = ["muscle", "diet", "health"] as const;
export type Purpose = (typeof PURPOSES)[number];

export const TIMINGS = ["post_workout", "morning", "before_sleep", "snack"] as const;
export type Timing = (typeof TIMINGS)[number];

export const PREFERENCES = [
  "lactose_free",
  "vegan",
  "low_sugar",
  "domestic",
  "low_price",
] as const;
export type Preference = (typeof PREFERENCES)[number];

export const PROTEIN_TYPES = ["whey", "wpi", "casein", "soy", "mix"] as const;
export type ProteinType = (typeof PROTEIN_TYPES)[number];

export const PAYMENT_METHODS = ["credit_card", "convenience_store", "bank_transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const DELIVERY_STATUSES = ["ordered", "shipping", "delivered"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const PURPOSE_LABELS: Record<Purpose, string> = {
  muscle: "筋肉をつけたい",
  diet: "ダイエット・減量",
  health: "健康維持・栄養補給",
};

export const TIMING_LABELS: Record<Timing, string> = {
  post_workout: "運動後",
  morning: "朝食時・朝",
  before_sleep: "就寝前",
  snack: "間食・おやつ代わり",
};

export const PREFERENCE_LABELS: Record<Preference, string> = {
  lactose_free: "乳糖不耐症対応（乳糖を抑えたもの）",
  vegan: "植物性（ヴィーガン対応）",
  low_sugar: "低糖質",
  domestic: "国内製造",
  low_price: "価格の安さ重視",
};

export const PROTEIN_TYPE_LABELS: Record<ProteinType, string> = {
  whey: "ホエイ",
  wpi: "WPI（ホエイアイソレート）",
  casein: "カゼイン",
  soy: "ソイ",
  mix: "ミックス",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  credit_card: "クレジットカード",
  convenience_store: "コンビニ払い",
  bank_transfer: "銀行振込",
};

// ui-spec.md §5（RV-17）
export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  ordered: "注文済み",
  shipping: "お届け中",
  delivered: "お届け済み",
};

// ---------- 商品と販売チャネル ----------

/** ネット通販ショップ。送料はショップごとの属性（ui-spec.md §6） */
export type Shop = {
  id: string;
  name: string;
  /** 送料（円）。0 は送料無料 */
  shippingFee: number;
  contactEmail: string;
  contactPhone: string;
};

/** 実店舗。店頭渡しのため送料の概念がない（ui-spec.md §6） */
export type Store = {
  id: string;
  name: string;
  access: string;
  phone: string;
  businessHours: string;
};

/** 商品 × ネット通販の価格。itemPrice は送料を含まない（db-design.md §5-5） */
export type ShopOffer = {
  shop: Shop;
  itemPrice: number;
};

/** 商品 × 実店舗の価格。price がそのまま総額（送料なし） */
export type StoreOffer = {
  store: Store;
  price: number;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  type: ProteinType;
  flavor: string;
  weightG: number;
  proteinContent: number;
  description: string;
  imageUrl: string;
  purposes: Purpose[];
  timings: Timing[];
  preferences: Preference[];
  shopOffers: ShopOffer[];
  storeOffers: StoreOffer[];
};
