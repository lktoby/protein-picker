// ============================================================
// F-09 サンプル商品データ
// 根拠: docs/03-design/db-design.md §8（商品 12 件・ショップ 9 件・実店舗 6 件）
//
// ※ 実在の商品・店舗・価格ではない架空のサンプルデータ。
// ※ 価格は「商品代金（送料を含まない）」で持つ。総額は itemPrice + shop.shippingFee（ui-spec.md §6）。
// ============================================================
import type { Preference, PaymentMethod, ProteinType, Purpose, Timing } from "@/server/domain/types";

/**
 * シードを冪等にするため ID を固定する。
 * UUID の最終ブロックは 12 桁なので、2 桁の接頭辞 + 10 桁の連番にする。
 */
const id = (prefix: string, n: number) =>
  `00000000-0000-4000-8000-${prefix}${String(n).padStart(10, "0")}`;

export const SEED_SHOPS = [
  { id: id("01", 1), name: "プロテインマート", shippingFee: 500, contactEmail: "support@protein-mart.example.com", contactPhone: "0120-111-222" },
  { id: id("01", 2), name: "フィットEC", shippingFee: 0, contactEmail: "cs@fit-ec.example.com", contactPhone: "03-1234-5678" },
  { id: id("01", 3), name: "ラボプラス公式ストア", shippingFee: 0, contactEmail: "info@laboplus.example.com", contactPhone: "0120-333-444" },
  { id: id("01", 4), name: "グリーンフィット公式", shippingFee: 600, contactEmail: "help@greenfit.example.com", contactPhone: "0120-555-666" },
  { id: id("01", 5), name: "ウェルネスオンライン", shippingFee: 500, contactEmail: "support@wellness-ph.example.com", contactPhone: "0120-777-888" },
  { id: id("01", 6), name: "パワーバリュー直販", shippingFee: 800, contactEmail: "cs@powervalue.example.com", contactPhone: "0570-123-456" },
  { id: id("01", 7), name: "和心堂オンライン", shippingFee: 600, contactEmail: "otoiawase@washindo.example.com", contactPhone: "0120-888-999" },
  { id: id("01", 8), name: "クリアラボストア", shippingFee: 500, contactEmail: "support@clearlab.example.com", contactPhone: "050-1234-5678" },
  { id: id("01", 9), name: "ナイトウェル公式", shippingFee: 0, contactEmail: "info@nightwell.example.com", contactPhone: "0120-000-111" },
] as const;

export const SEED_STORES = [
  { id: id("02", 1), name: "フィットネスショップ 池袋店", access: "JR池袋駅 東口から徒歩5分", phone: "03-1111-2222", businessHours: "10:00-21:00" },
  { id: id("02", 2), name: "サプリステーション 新宿店", access: "新宿駅 南口から徒歩3分", phone: "03-3333-4444", businessHours: "11:00-20:00" },
  { id: id("02", 3), name: "ナチュラルマーケット 渋谷店", access: "渋谷駅 ハチ公口から徒歩7分", phone: "03-5555-6666", businessHours: "10:00-22:00" },
  { id: id("02", 4), name: "ナチュラルマーケット 横浜店", access: "横浜駅 西口から徒歩10分", phone: "045-777-8888", businessHours: "10:00-21:00" },
  { id: id("02", 5), name: "ドラッグワン 上野店", access: "上野駅 中央改札から徒歩4分", phone: "03-9999-0000", businessHours: "9:00-22:00" },
  { id: id("02", 6), name: "ドラッグワン 川崎店", access: "川崎駅 東口から徒歩6分", phone: "044-222-3333", businessHours: "9:00-22:00" },
] as const;

const SHOP = Object.fromEntries(SEED_SHOPS.map((s, i) => [i + 1, s.id])) as Record<number, string>;
const STORE = Object.fromEntries(SEED_STORES.map((s, i) => [i + 1, s.id])) as Record<number, string>;

export type SeedProduct = {
  id: string;
  name: string;
  brand: string;
  type: ProteinType;
  flavor: string;
  weightG: number;
  proteinContent: number;
  description: string;
  imageUrl: string;
  productGroupKey: string | null;
  purposes: Purpose[];
  timings: Timing[];
  preferences: Preference[];
  /** [ショップ番号, 商品代金（送料を含まない）] */
  shopOffers: [number, number][];
  /** [店舗番号, 店頭価格] */
  storeOffers: [number, number][];
};

/** 商品画像。実写が用意できるまでは種類ごとのモノクロのプレースホルダー画像を使う */
const image = (type: ProteinType) => `/images/products/${type}.svg`;

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: id("03", 1), name: "マッスルグロウ ホエイ100", brand: "筋トレ堂", type: "whey",
    flavor: "チョコレート風味", weightG: 1000, proteinContent: 75,
    description: "定番のホエイプロテイン。溶けやすく、トレーニング後の一杯に。",
    imageUrl: image("whey"), productGroupKey: "muscle-grow-whey-100",
    purposes: ["muscle"], timings: ["post_workout"], preferences: [],
    shopOffers: [[1, 3480], [2, 4180]], storeOffers: [[1, 4280]],
  },
  {
    id: id("03", 2), name: "ピュアアイソレート WPI", brand: "ラボプラス", type: "wpi",
    flavor: "プレーン", weightG: 900, proteinContent: 90,
    description: "乳糖を極限まで除去した高純度ホエイ。お腹がゴロゴロしやすい人にも。",
    imageUrl: image("wpi"), productGroupKey: null,
    purposes: ["muscle", "diet"], timings: ["post_workout", "morning"],
    preferences: ["lactose_free", "low_sugar"],
    shopOffers: [[3, 5480], [1, 5180]], storeOffers: [[2, 5800]],
  },
  {
    id: id("03", 3), name: "ソイスリム", brand: "グリーンフィット", type: "soy",
    flavor: "ココア風味", weightG: 900, proteinContent: 72,
    description: "大豆由来でゆっくり吸収。腹持ちがよくダイエット中の置き換えにも。",
    imageUrl: image("soy"), productGroupKey: null,
    purposes: ["diet", "health"], timings: ["morning", "snack"],
    preferences: ["lactose_free", "vegan", "low_sugar"],
    shopOffers: [[4, 3180]], storeOffers: [[3, 3980], [4, 3980]],
  },
  {
    id: id("03", 4), name: "ナイトカゼイン", brand: "ラボプラス", type: "casein",
    flavor: "バニラ風味", weightG: 1000, proteinContent: 70,
    description: "就寝前に。ゆっくり吸収されるカゼインが長時間タンパク質を補給。",
    imageUrl: image("casein"), productGroupKey: null,
    purposes: ["muscle", "health"], timings: ["before_sleep"], preferences: [],
    shopOffers: [[3, 4680], [2, 4480]], storeOffers: [],
  },
  {
    id: id("03", 5), name: "デイリーバランス プロテイン", brand: "ウェルネス製薬", type: "mix",
    flavor: "ミルクティー風味", weightG: 800, proteinContent: 65,
    description: "ホエイとソイのバランス型。11種のビタミン配合で毎日の栄養補給に。",
    imageUrl: image("mix"), productGroupKey: null,
    purposes: ["health"], timings: ["morning", "snack"], preferences: ["domestic"],
    shopOffers: [[5, 2980], [1, 3080]], storeOffers: [[5, 3680]],
  },
  {
    id: id("03", 6), name: "マッスルグロウ ホエイ100", brand: "筋トレ堂", type: "whey",
    flavor: "ストロベリー風味", weightG: 1000, proteinContent: 74,
    description: "人気のストロベリー味。甘さ控えめでトレーニング後も飲みやすい。",
    imageUrl: image("whey"), productGroupKey: "muscle-grow-whey-100",
    purposes: ["muscle"], timings: ["post_workout"], preferences: ["low_price"],
    shopOffers: [[1, 3280]], storeOffers: [[1, 3980]],
  },
  {
    id: id("03", 7), name: "コスパホエイ 3kg", brand: "パワーバリュー", type: "whey",
    flavor: "プレーン", weightG: 3000, proteinContent: 70,
    description: "大容量でとにかく安い。毎日飲む人のコスパ最強クラス。",
    imageUrl: image("whey"), productGroupKey: null,
    purposes: ["muscle", "health"], timings: ["post_workout", "morning"],
    preferences: ["low_price"],
    shopOffers: [[6, 8680], [2, 9980]], storeOffers: [],
  },
  {
    id: id("03", 8), name: "大豆習慣 ソイプロテイン", brand: "和心堂", type: "soy",
    flavor: "きなこ風味", weightG: 1000, proteinContent: 68,
    description: "国内製造・きなこ風味の和風ソイ。豆乳や牛乳と相性抜群。",
    imageUrl: image("soy"), productGroupKey: null,
    purposes: ["health", "diet"], timings: ["morning", "before_sleep"],
    preferences: ["vegan", "lactose_free", "domestic"],
    shopOffers: [[7, 3380]], storeOffers: [[5, 4180]],
  },
  {
    id: id("03", 9), name: "WPIクリア", brand: "クリアラボ", type: "wpi",
    flavor: "グレープ風味", weightG: 700, proteinContent: 88,
    description: "ジュース感覚でゴクゴク飲めるクリアタイプ。乳っぽさが苦手な人に。",
    imageUrl: image("wpi"), productGroupKey: null,
    purposes: ["diet", "muscle"], timings: ["post_workout"],
    preferences: ["lactose_free", "low_sugar"],
    shopOffers: [[8, 4480], [1, 4680]], storeOffers: [[2, 5280]],
  },
  {
    id: id("03", 10), name: "スローカゼイン", brand: "ナイトウェル", type: "casein",
    flavor: "ミルク風味", weightG: 750, proteinContent: 71,
    description: "低糖質設計のカゼイン。夜の小腹対策とダイエット中の栄養補給に。",
    imageUrl: image("casein"), productGroupKey: null,
    purposes: ["diet"], timings: ["before_sleep", "snack"], preferences: ["low_sugar"],
    shopOffers: [[9, 4280]], storeOffers: [],
  },
  {
    id: id("03", 11), name: "ジュニア&ファミリー プロテイン", brand: "ウェルネス製薬", type: "mix",
    flavor: "ココア風味", weightG: 700, proteinContent: 55,
    description: "家族みんなで飲める栄養機能食品タイプ。カルシウム・鉄配合。",
    imageUrl: image("mix"), productGroupKey: null,
    purposes: ["health"], timings: ["morning", "snack"],
    preferences: ["domestic", "low_sugar"],
    shopOffers: [[5, 2480]], storeOffers: [[5, 3080], [6, 3080]],
  },
  {
    id: id("03", 12), name: "ベジプロテイン", brand: "グリーンフィット", type: "soy",
    flavor: "アーモンド風味", weightG: 750, proteinContent: 70,
    description: "100%植物性。人工甘味料不使用でナチュラル志向の人に。",
    imageUrl: image("soy"), productGroupKey: null,
    purposes: ["diet", "health"], timings: ["morning"],
    preferences: ["vegan", "lactose_free"],
    shopOffers: [[4, 3780]], storeOffers: [[3, 4580]],
  },
];

export const SHOP_ID_BY_INDEX = SHOP;
export const STORE_ID_BY_INDEX = STORE;

/** ダミー決済で使える支払い方法（ui-spec.md §4） */
export const DUMMY_PAYMENT_METHODS: PaymentMethod[] = [
  "credit_card",
  "convenience_store",
  "bank_transfer",
];
