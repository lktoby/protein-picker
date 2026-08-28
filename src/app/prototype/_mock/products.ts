// ============================================================
// プロトタイプ用モックデータ（捨てる前提のベタ書きデータ）
// 実在の商品・店舗・価格ではありません。
// ============================================================

export type Purpose = "muscle" | "diet" | "health";
export type Timing = "postWorkout" | "morning" | "beforeSleep" | "snack";
export type Preference = "lactoseFree" | "vegan" | "lowSugar" | "domestic" | "lowPrice";

export const PURPOSE_LABELS: Record<Purpose, string> = {
  muscle: "筋肉をつけたい",
  diet: "ダイエット・減量",
  health: "健康維持・栄養補給",
};

export const TIMING_LABELS: Record<Timing, string> = {
  postWorkout: "運動後",
  morning: "朝食時・朝",
  beforeSleep: "就寝前",
  snack: "間食・おやつ代わり",
};

export const PREFERENCE_LABELS: Record<Preference, string> = {
  lactoseFree: "乳糖不耐症対応（乳糖を抑えたもの）",
  vegan: "植物性（ヴィーガン対応）",
  lowSugar: "低糖質",
  domestic: "国内製造",
  lowPrice: "価格の安さ重視",
};

export type OnlineShop = {
  id: string;
  name: string;
  price: number; // 販売価格（円・送料込み。内訳は SHOP_SHIPPING_FEES を参照）
  email: string;
  phone: string;
};

/**
 * RV-16: ショップごとの送料（円）。表示価格（price）にこの額が含まれている。
 * 「送料込み」だけでは内訳が見えないため、商品代金と送料を分けて表示するためのデータ。
 */
export const SHOP_SHIPPING_FEES: Record<string, number> = {
  "s-mart": 500,
  "s-fitec": 0,
  "s-labo": 0,
  "s-green": 600,
  "s-wellness": 500,
  "s-power": 800,
  "s-washin": 600,
  "s-clear": 500,
  "s-nightwell": 0,
};

/** 送料（円）。0 は送料無料 */
export function shippingFeeOf(shopId: string): number {
  return SHOP_SHIPPING_FEES[shopId] ?? 0;
}

/** 商品代金のみ（送料を除いた額・円） */
export function itemPriceOf(shop: OnlineShop): number {
  return shop.price - shippingFeeOf(shop.id);
}

/** 「商品 3,480円 + 送料 500円」「送料無料」のような内訳の表示文（RV-16） */
export function shippingBreakdownLabel(shop: OnlineShop): string {
  const fee = shippingFeeOf(shop.id);
  return fee === 0
    ? "送料無料"
    : `商品 ${formatYen(itemPriceOf(shop))} + 送料 ${formatYen(fee)}`;
}

export type PhysicalStore = {
  id: string;
  name: string;
  price: number; // 店頭販売価格（円）
  access: string; // アクセス方法
  phone: string;
  hours: string;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  type: "ホエイ" | "WPI（ホエイアイソレート）" | "カゼイン" | "ソイ" | "ミックス";
  flavor: string;
  weightG: number; // 内容量（g）
  proteinContent: number; // タンパク質含有率（%）
  emoji: string; // 商品写真の代わりのプレースホルダー
  colors: [string, string]; // プレースホルダー背景のグラデーション
  description: string;
  purposes: Purpose[];
  timings: Timing[];
  preferences: Preference[];
  onlineShops: OnlineShop[];
  stores: PhysicalStore[];
};

export const PRODUCTS: Product[] = [
  {
    id: "p01",
    name: "マッスルグロウ ホエイ100",
    brand: "筋トレ堂",
    type: "ホエイ",
    flavor: "チョコレート風味",
    weightG: 1000,
    proteinContent: 75,
    emoji: "🍫",
    colors: ["#8d6e63", "#4e342e"],
    description: "定番のホエイプロテイン。溶けやすく、トレーニング後の一杯に。",
    purposes: ["muscle"],
    timings: ["postWorkout"],
    preferences: [],
    onlineShops: [
      { id: "s-mart", name: "プロテインマート", price: 3980, email: "support@protein-mart.example.com", phone: "0120-111-222" },
      { id: "s-fitec", name: "フィットEC", price: 4180, email: "cs@fit-ec.example.com", phone: "03-1234-5678" },
    ],
    stores: [
      { id: "st-ikebukuro", name: "フィットネスショップ 池袋店", price: 4280, access: "JR池袋駅 東口から徒歩5分", phone: "03-1111-2222", hours: "10:00-21:00" },
    ],
  },
  {
    id: "p02",
    name: "ピュアアイソレート WPI",
    brand: "ラボプラス",
    type: "WPI（ホエイアイソレート）",
    flavor: "プレーン",
    weightG: 900,
    proteinContent: 90,
    emoji: "🥛",
    colors: ["#90caf9", "#1565c0"],
    description: "乳糖を極限まで除去した高純度ホエイ。お腹がゴロゴロしやすい人にも。",
    purposes: ["muscle", "diet"],
    timings: ["postWorkout", "morning"],
    preferences: ["lactoseFree", "lowSugar"],
    onlineShops: [
      { id: "s-labo", name: "ラボプラス公式ストア", price: 5480, email: "info@laboplus.example.com", phone: "0120-333-444" },
      { id: "s-mart", name: "プロテインマート", price: 5680, email: "support@protein-mart.example.com", phone: "0120-111-222" },
    ],
    stores: [
      { id: "st-shinjuku", name: "サプリステーション 新宿店", price: 5800, access: "新宿駅 南口から徒歩3分", phone: "03-3333-4444", hours: "11:00-20:00" },
    ],
  },
  {
    id: "p03",
    name: "ソイスリム",
    brand: "グリーンフィット",
    type: "ソイ",
    flavor: "ココア風味",
    weightG: 900,
    proteinContent: 72,
    emoji: "🌱",
    colors: ["#a5d6a7", "#2e7d32"],
    description: "大豆由来でゆっくり吸収。腹持ちがよくダイエット中の置き換えにも。",
    purposes: ["diet", "health"],
    timings: ["morning", "snack"],
    preferences: ["lactoseFree", "vegan", "lowSugar"],
    onlineShops: [
      { id: "s-green", name: "グリーンフィット公式", price: 3780, email: "help@greenfit.example.com", phone: "0120-555-666" },
    ],
    stores: [
      { id: "st-shibuya", name: "ナチュラルマーケット 渋谷店", price: 3980, access: "渋谷駅 ハチ公口から徒歩7分", phone: "03-5555-6666", hours: "10:00-22:00" },
      { id: "st-yokohama", name: "ナチュラルマーケット 横浜店", price: 3980, access: "横浜駅 西口から徒歩10分", phone: "045-777-8888", hours: "10:00-21:00" },
    ],
  },
  {
    id: "p04",
    name: "ナイトカゼイン",
    brand: "ラボプラス",
    type: "カゼイン",
    flavor: "バニラ風味",
    weightG: 1000,
    proteinContent: 70,
    emoji: "🌙",
    colors: ["#b39ddb", "#4527a0"],
    description: "就寝前に。ゆっくり吸収されるカゼインが長時間タンパク質を補給。",
    purposes: ["muscle", "health"],
    timings: ["beforeSleep"],
    preferences: [],
    onlineShops: [
      { id: "s-labo", name: "ラボプラス公式ストア", price: 4680, email: "info@laboplus.example.com", phone: "0120-333-444" },
      { id: "s-fitec", name: "フィットEC", price: 4480, email: "cs@fit-ec.example.com", phone: "03-1234-5678" },
    ],
    stores: [],
  },
  {
    id: "p05",
    name: "デイリーバランス プロテイン",
    brand: "ウェルネス製薬",
    type: "ミックス",
    flavor: "ミルクティー風味",
    weightG: 800,
    proteinContent: 65,
    emoji: "🫖",
    colors: ["#ffcc80", "#e65100"],
    description: "ホエイ＋ソイのバランス型。11種のビタミン配合で毎日の栄養補給に。",
    purposes: ["health"],
    timings: ["morning", "snack"],
    preferences: ["domestic"],
    onlineShops: [
      { id: "s-wellness", name: "ウェルネスオンライン", price: 3480, email: "support@wellness-ph.example.com", phone: "0120-777-888" },
      { id: "s-mart", name: "プロテインマート", price: 3580, email: "support@protein-mart.example.com", phone: "0120-111-222" },
    ],
    stores: [
      { id: "st-drug-ueno", name: "ドラッグワン 上野店", price: 3680, access: "上野駅 中央改札から徒歩4分", phone: "03-9999-0000", hours: "9:00-22:00" },
    ],
  },
  {
    id: "p06",
    name: "マッスルグロウ ホエイ100",
    brand: "筋トレ堂",
    type: "ホエイ",
    flavor: "ストロベリー風味",
    weightG: 1000,
    proteinContent: 74,
    emoji: "🍓",
    colors: ["#f48fb1", "#ad1457"],
    description: "人気のストロベリー味。甘さ控えめでトレーニング後も飲みやすい。",
    purposes: ["muscle"],
    timings: ["postWorkout"],
    preferences: ["lowPrice"],
    onlineShops: [
      { id: "s-mart", name: "プロテインマート", price: 3780, email: "support@protein-mart.example.com", phone: "0120-111-222" },
    ],
    stores: [
      { id: "st-ikebukuro", name: "フィットネスショップ 池袋店", price: 3980, access: "JR池袋駅 東口から徒歩5分", phone: "03-1111-2222", hours: "10:00-21:00" },
    ],
  },
  {
    id: "p07",
    name: "コスパホエイ 3kg",
    brand: "パワーバリュー",
    type: "ホエイ",
    flavor: "プレーン",
    weightG: 3000,
    proteinContent: 70,
    emoji: "💪",
    colors: ["#ffe082", "#ff8f00"],
    description: "大容量でとにかく安い。毎日飲む人のコスパ最強クラス。",
    purposes: ["muscle", "health"],
    timings: ["postWorkout", "morning"],
    preferences: ["lowPrice"],
    onlineShops: [
      { id: "s-power", name: "パワーバリュー直販", price: 9480, email: "cs@powervalue.example.com", phone: "0570-123-456" },
      { id: "s-fitec", name: "フィットEC", price: 9980, email: "cs@fit-ec.example.com", phone: "03-1234-5678" },
    ],
    stores: [],
  },
  {
    id: "p08",
    name: "大豆習慣 ソイプロテイン",
    brand: "和心堂",
    type: "ソイ",
    flavor: "きなこ風味",
    weightG: 1000,
    proteinContent: 68,
    emoji: "🍵",
    colors: ["#d7ccc8", "#5d4037"],
    description: "国内製造・きなこ風味の和風ソイ。豆乳や牛乳と相性抜群。",
    purposes: ["health", "diet"],
    timings: ["morning", "beforeSleep"],
    preferences: ["vegan", "lactoseFree", "domestic"],
    onlineShops: [
      { id: "s-washin", name: "和心堂オンライン", price: 3980, email: "otoiawase@washindo.example.com", phone: "0120-888-999" },
    ],
    stores: [
      { id: "st-drug-ueno", name: "ドラッグワン 上野店", price: 4180, access: "上野駅 中央改札から徒歩4分", phone: "03-9999-0000", hours: "9:00-22:00" },
    ],
  },
  {
    id: "p09",
    name: "WPIクリア",
    brand: "クリアラボ",
    type: "WPI（ホエイアイソレート）",
    flavor: "グレープ風味",
    weightG: 700,
    proteinContent: 88,
    emoji: "🍇",
    colors: ["#ce93d8", "#6a1b9a"],
    description: "ジュース感覚でゴクゴク飲めるクリアタイプ。乳っぽさが苦手な人に。",
    purposes: ["diet", "muscle"],
    timings: ["postWorkout"],
    preferences: ["lactoseFree", "lowSugar"],
    onlineShops: [
      { id: "s-clear", name: "クリアラボストア", price: 4980, email: "support@clearlab.example.com", phone: "050-1234-5678" },
      { id: "s-mart", name: "プロテインマート", price: 5180, email: "support@protein-mart.example.com", phone: "0120-111-222" },
    ],
    stores: [
      { id: "st-shinjuku", name: "サプリステーション 新宿店", price: 5280, access: "新宿駅 南口から徒歩3分", phone: "03-3333-4444", hours: "11:00-20:00" },
    ],
  },
  {
    id: "p10",
    name: "スローカゼイン",
    brand: "ナイトウェル",
    type: "カゼイン",
    flavor: "ミルク風味",
    weightG: 750,
    proteinContent: 71,
    emoji: "😴",
    colors: ["#9fa8da", "#283593"],
    description: "低糖質設計のカゼイン。夜の小腹対策とダイエット中の栄養補給に。",
    purposes: ["diet"],
    timings: ["beforeSleep", "snack"],
    preferences: ["lowSugar"],
    onlineShops: [
      { id: "s-nightwell", name: "ナイトウェル公式", price: 4280, email: "info@nightwell.example.com", phone: "0120-000-111" },
    ],
    stores: [],
  },
  {
    id: "p11",
    name: "ジュニア&ファミリー プロテイン",
    brand: "ウェルネス製薬",
    type: "ミックス",
    flavor: "ココア風味",
    weightG: 700,
    proteinContent: 55,
    emoji: "👨‍👩‍👧",
    colors: ["#ffab91", "#bf360c"],
    description: "家族みんなで飲める栄養機能食品タイプ。カルシウム・鉄配合。",
    purposes: ["health"],
    timings: ["morning", "snack"],
    preferences: ["domestic", "lowSugar"],
    onlineShops: [
      { id: "s-wellness", name: "ウェルネスオンライン", price: 2980, email: "support@wellness-ph.example.com", phone: "0120-777-888" },
    ],
    stores: [
      { id: "st-drug-ueno", name: "ドラッグワン 上野店", price: 3080, access: "上野駅 中央改札から徒歩4分", phone: "03-9999-0000", hours: "9:00-22:00" },
      { id: "st-drug-kawasaki", name: "ドラッグワン 川崎店", price: 3080, access: "川崎駅 東口から徒歩6分", phone: "044-222-3333", hours: "9:00-22:00" },
    ],
  },
  {
    id: "p12",
    name: "ベジプロテイン",
    brand: "グリーンフィット",
    type: "ソイ",
    flavor: "アーモンド風味",
    weightG: 750,
    proteinContent: 70,
    emoji: "🥜",
    colors: ["#c5e1a5", "#558b2f"],
    description: "100%植物性。人工甘味料不使用でナチュラル志向の人に。",
    purposes: ["diet", "health"],
    timings: ["morning"],
    preferences: ["vegan", "lactoseFree"],
    onlineShops: [
      { id: "s-green", name: "グリーンフィット公式", price: 4380, email: "help@greenfit.example.com", phone: "0120-555-666" },
    ],
    stores: [
      { id: "st-shibuya", name: "ナチュラルマーケット 渋谷店", price: 4580, access: "渋谷駅 ハチ公口から徒歩7分", phone: "03-5555-6666", hours: "10:00-22:00" },
    ],
  },
];

// ---------- ヘルパー ----------

/**
 * 最安値（円）: ネット通販・実店舗を含む全販売チャネルの最低価格（送料込み）。
 * 定義は ui-spec.md §6 に準拠。
 */
export function minOnlinePrice(p: Product): number {
  const prices = [...p.onlineShops.map((s) => s.price), ...p.stores.map((s) => s.price)];
  return Math.min(...prices);
}

/** 1g あたりの価格（最安値ベース、円） */
export function pricePerGram(p: Product): number {
  return minOnlinePrice(p) / p.weightG;
}

export function formatYen(n: number): string {
  return `${n.toLocaleString("ja-JP")}円`;
}

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/** 最安値を出している販売元（ネット通販 or 実店舗）（RV-16 の追加指摘） */
export type CheapestSource =
  | { kind: "online"; name: string; price: number; shippingFee: number }
  | { kind: "store"; name: string; price: number };

export function cheapestSource(p: Product): CheapestSource {
  const candidates: CheapestSource[] = [
    ...p.onlineShops.map((s) => ({
      kind: "online" as const,
      name: s.name,
      price: s.price,
      shippingFee: shippingFeeOf(s.id),
    })),
    ...p.stores.map((s) => ({ kind: "store" as const, name: s.name, price: s.price })),
  ];
  return candidates.reduce((min, c) => (c.price < min.price ? c : min));
}

/**
 * 価格のすぐ横に添える送料の注記（RV-18①）。
 * 「最安値・送料込み」では送料がいくらか分からないため、金額を明記する。
 * 例: 「内 送料 500円」／「送料無料」／「店頭価格・送料なし」
 */
export function shippingNoteOf(p: Product): string {
  const src = cheapestSource(p);
  if (src.kind === "store") return "店頭価格・送料なし";
  return src.shippingFee === 0 ? "送料無料" : `内 送料 ${formatYen(src.shippingFee)}`;
}

/** 最安値を出している販売元の名前（どこの価格かを示す） */
export function cheapestSourceName(p: Product): string {
  return cheapestSource(p).name;
}

// ---------- おすすめ計算（モック：ローカルのルールベース） ----------
// ※ 本実装での計算方式（外部 AI API か ローカル計算か）は /design で決定する。
//   デモでは「条件 → おすすめ順＋理由」の体験を見せることが目的。

export type RecommendInput = {
  purpose: Purpose;
  timing: Timing;
  preferences: Preference[];
};

export type Recommendation = {
  product: Product;
  score: number;
  reason: string; // 1行のおすすめ理由
  matches: string[]; // 一致した条件（順位根拠の表示用・RV-09）
};

const TYPE_TIMING_NOTES: Record<string, string> = {
  "ホエイ:postWorkout": "運動後に素早く吸収されるホエイ",
  "WPI（ホエイアイソレート）:postWorkout": "運動後の吸収が速い高純度WPI",
  "カゼイン:beforeSleep": "就寝前にゆっくり長く吸収されるカゼイン",
  "ソイ:snack": "腹持ちがよく間食にぴったりのソイ",
  "ソイ:morning": "朝にうれしい植物性のソイ",
};

export function recommend(input: RecommendInput): Recommendation[] {
  const results: Recommendation[] = [];

  for (const p of PRODUCTS) {
    // 乳糖不耐症対応を選んだ場合、非対応商品は除外（安心のためのハードフィルタ）
    if (input.preferences.includes("lactoseFree") && !p.preferences.includes("lactoseFree")) {
      continue;
    }

    let score = 0;
    const reasons: string[] = [];
    const matches: string[] = [];

    if (p.purposes.includes(input.purpose)) {
      score += 30;
      matches.push(PURPOSE_LABELS[input.purpose]);
      reasons.push(`「${PURPOSE_LABELS[input.purpose]}」にぴったり`);
    }
    if (p.timings.includes(input.timing)) {
      score += 20;
      matches.push(TIMING_LABELS[input.timing]);
      const note = TYPE_TIMING_NOTES[`${p.type}:${input.timing}`];
      reasons.push(note ?? `${TIMING_LABELS[input.timing]}の一杯に合う`);
    }
    for (const pref of input.preferences) {
      if (pref === "lowPrice") {
        // RV-09: 「価格の安さ重視」はタグではなく実際の価格で総合評価する。
        // 1gあたりが安いほど加点し、総額が高い商品は減点（初めてでも手を出しやすい総額を優遇）。
        const ppg = pricePerGram(p);
        const price = minOnlinePrice(p);
        const economy = Math.max(0, Math.min(20, (5.2 - ppg) * 8));
        const affordability = Math.max(-8, Math.min(8, (4200 - price) / 350));
        score += economy + affordability;
        if (economy > 0) {
          matches.push(PREFERENCE_LABELS.lowPrice);
          reasons.push(
            `1gあたり約${ppg.toFixed(1)}円・総額${formatYen(price)}で価格重視にマッチ`
          );
        }
        continue;
      }
      if (p.preferences.includes(pref)) {
        score += 15;
        matches.push(PREFERENCE_LABELS[pref]);
        if (pref === "lactoseFree") reasons.push("乳糖を抑えているのでお腹にやさしい");
        if (pref === "vegan") reasons.push("100%植物性");
        if (pref === "lowSugar") reasons.push("低糖質");
        if (pref === "domestic") reasons.push("国内製造で安心");
      }
    }
    if (p.proteinContent >= 85) {
      score += 8;
      reasons.push(`タンパク質含有率${p.proteinContent}%の高含有`);
    }

    if (score <= 0) continue;

    results.push({
      product: p,
      score,
      matches,
      reason: reasons.slice(0, 3).join("。") + "。",
    });
  }

  return results
    .sort((a, b) => b.score - a.score || pricePerGram(a.product) - pricePerGram(b.product))
    .slice(0, 5);
}
